import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { realtimeManager } from "./realtime/websocket";
import { notifyDriversAboutRide, scheduleReMatching } from "./domains/rides/matching";
import { calculateFare, serializeFareBreakdown } from "./domains/rides/pricing";

// Helper procedures
const passengerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "passenger" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas passageiros podem acessar" });
  }
  return next({ ctx });
});

const driverProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "driver" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas motoristas podem acessar" });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem acessar" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  profile: router({
    update: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        role: z.enum(["passenger", "driver"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, {
          ...input,
          profileCompleted: 1,
        });
        return { success: true };
      }),
    
    completeProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        role: z.enum(["passenger", "driver"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, {
          name: input.name,
          phone: input.phone,
          role: input.role,
          profileCompleted: 1,
        });
        return { success: true };
      }),
  }),

  rides: router({
    // Calculate fare estimate
    calculateFare: publicProcedure
      .input(z.object({
        distanceKm: z.number(),
        durationMinutes: z.number(),
        tenantId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get tenant settings (default to tenant 1 for now)
        const tenantId = input.tenantId || 1;
        const settings = await db.getTenantSettings(tenantId);
        
        if (!settings) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Configurações do tenant não encontradas" });
        }

        const fareBreakdown = calculateFare({
          distanceKm: input.distanceKm,
          durationMinutes: input.durationMinutes,
          baseFare: parseFloat(settings.baseFare),
          pricePerKm: parseFloat(settings.pricePerKm),
          pricePerMinute: parseFloat(settings.pricePerMinute),
          minimumFare: parseFloat(settings.minimumFare),
          currency: settings.currency,
          surgePricing: false, // TODO: Add surge pricing logic based on demand
        });

        return fareBreakdown;
      }),

    // Passenger: create ride request
    request: passengerProcedure
      .input(z.object({
        originAddress: z.string(),
        originLat: z.string(),
        originLng: z.string(),
        destinationAddress: z.string(),
        destinationLat: z.string(),
        destinationLng: z.string(),
        distanceKm: z.string(),
        priceEstimate: z.string(),
        scheduledAt: z.string().optional(),
        isScheduled: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if passenger already has an active ride (only for immediate rides)
        if (!input.isScheduled || input.isScheduled !== "1") {
          const activeRide = await db.getActiveRideForPassenger(ctx.user.id);
          if (activeRide) {
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: "Você já tem uma corrida ativa" 
            });
          }
        }

        const rideData: any = {
          passengerId: ctx.user.id,
          originAddress: input.originAddress,
          originLat: input.originLat,
          originLng: input.originLng,
          destinationAddress: input.destinationAddress,
          destinationLat: input.destinationLat,
          destinationLng: input.destinationLng,
          distanceKm: input.distanceKm,
          priceEstimate: input.priceEstimate,
        };

        if (input.isScheduled === "1" && input.scheduledAt) {
          rideData.scheduledAt = new Date(input.scheduledAt);
          rideData.isScheduled = 1;
        }

        const ride = await db.createRide(rideData);
        
        // Start matching process for immediate rides
        if (!input.isScheduled || input.isScheduled !== "1") {
          console.log(`[Matching] Starting matching for ride ${ride.id}`);
          
          // Notify nearby drivers
          const notifiedCount = await notifyDriversAboutRide(
            ride.id,
            input.originLat,
            input.originLng,
            input.originAddress,
            input.destinationAddress,
            input.distanceKm,
            input.priceEstimate
          );
          
          console.log(`[Matching] Notified ${notifiedCount} drivers for ride ${ride.id}`);
          
          // Schedule re-matching if no driver accepts within 30 seconds
          if (notifiedCount > 0) {
            scheduleReMatching(
              ride.id,
              input.originLat,
              input.originLng,
              input.originAddress,
              input.destinationAddress,
              input.distanceKm,
              input.priceEstimate,
              30
            );
          }
        }
        
        return ride;
      }),

    // Passenger: get active ride
    getActive: passengerProcedure.query(async ({ ctx }) => {
      return await db.getActiveRideForPassenger(ctx.user.id);
    }),

    // Passenger: get ride history
    getHistory: passengerProcedure.query(async ({ ctx }) => {
      return await db.getRidesByPassenger(ctx.user.id);
    }),

    // Passenger: cancel ride
    cancel: passengerProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }
        if (ride.passengerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode cancelar esta corrida" });
        }
        if (ride.status !== "requested" && ride.status !== "accepted") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Corrida não pode ser cancelada" });
        }

        await db.updateRideStatus(input.rideId, "cancelled");
        
        // Notify driver if ride was accepted
        if (ride.status === "accepted" && ride.driverId) {
          realtimeManager.notifyRideStatusChanged(input.rideId, {
            rideId: input.rideId,
            oldStatus: ride.status,
            newStatus: "cancelled",
            passengerId: ctx.user.id,
          });
          
          // Leave ride room
          realtimeManager.leaveRideRoom(input.rideId, ctx.user.id, "passenger");
          realtimeManager.leaveRideRoom(input.rideId, ride.driverId, "driver");
        }
        
        return { success: true };
      }),

    // Driver: get available rides
    getAvailable: driverProcedure.query(async () => {
      return await db.getAvailableRides();
    }),

    // Driver: get active ride
    getActiveDriver: driverProcedure.query(async ({ ctx }) => {
      return await db.getActiveRideForDriver(ctx.user.id);
    }),

    // Driver: get ride history
    getHistoryDriver: driverProcedure.query(async ({ ctx }) => {
      return await db.getRidesByDriver(ctx.user.id);
    }),

    // Driver: accept ride
    accept: driverProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Check if driver already has an active ride
        const activeRide = await db.getActiveRideForDriver(ctx.user.id);
        if (activeRide) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Você já tem uma corrida ativa" 
          });
        }

        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }
        if (ride.status !== "requested") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Corrida não está disponível" });
        }

        await db.updateRideStatus(input.rideId, "accepted", ctx.user.id);
        
        // Notify passenger that driver accepted
        realtimeManager.notifyRideStatusChanged(input.rideId, {
          rideId: input.rideId,
          oldStatus: "requested",
          newStatus: "accepted",
          driverId: ctx.user.id,
        });
        
        // Join ride room for realtime updates
        realtimeManager.joinRideRoom(input.rideId, ctx.user.id, "driver");
        realtimeManager.joinRideRoom(input.rideId, ride.passengerId, "passenger");
        
        return { success: true };
      }),

    // Driver: start ride
    start: driverProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }
        if (ride.driverId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode iniciar esta corrida" });
        }
        if (ride.status !== "accepted") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Corrida não pode ser iniciada" });
        }

        await db.updateRideStatus(input.rideId, "in_progress");
        
        // Notify passenger that ride started
        realtimeManager.notifyRideStatusChanged(input.rideId, {
          rideId: input.rideId,
          oldStatus: "accepted",
          newStatus: "in_progress",
          driverId: ctx.user.id,
        });
        
        return { success: true };
      }),

    // Driver: complete ride
    complete: driverProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }
        if (ride.driverId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode completar esta corrida" });
        }
        if (ride.status !== "in_progress") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Corrida não pode ser completada" });
        }

        await db.updateRideStatus(input.rideId, "completed");
        
        // Notify passenger that ride completed
        realtimeManager.notifyRideStatusChanged(input.rideId, {
          rideId: input.rideId,
          oldStatus: "in_progress",
          newStatus: "completed",
          driverId: ctx.user.id,
        });
        
        // Leave ride room
        realtimeManager.leaveRideRoom(input.rideId, ctx.user.id, "driver");
        realtimeManager.leaveRideRoom(input.rideId, ride.passengerId, "passenger");
        
        return { success: true };
      }),

    // Get ride details (both passenger and driver)
    getById: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .query(async ({ ctx, input }) => {
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }
        
        // Check if user is passenger or driver of this ride
        if (ride.passengerId !== ctx.user.id && ride.driverId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode acessar esta corrida" });
        }

        return ride;
      }),
  }),



  addressHistory: router({
    // Save address to history
    save: protectedProcedure
      .input(z.object({
        address: z.string(),
        lat: z.string(),
        lng: z.string(),
        placeId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.saveAddressToHistory({
          userId: ctx.user.id,
          address: input.address,
          lat: input.lat,
          lng: input.lng,
          placeId: input.placeId,
        });
        return { success: true };
      }),

    // Get recent addresses
    getRecent: protectedProcedure.query(async ({ ctx }) => {
      return await db.getRecentAddresses(ctx.user.id);
    }),
  }),

  ratings: router({
    // Save rating after ride completion
    create: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        driverId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the ride belongs to this passenger and is completed
        const ride = await db.getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Corrida não encontrada" });
        }
        if (ride.passengerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não pode avaliar esta corrida" });
        }
        if (ride.status !== "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Apenas corridas finalizadas podem ser avaliadas" });
        }

        // Check if already rated
        const existingRating = await db.getRatingByRideId(input.rideId);
        if (existingRating) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você já avaliou esta corrida" });
        }

        await db.createRating({
          rideId: input.rideId,
          passengerId: ctx.user.id,
          driverId: input.driverId,
          rating: input.rating,
          comment: input.comment,
        });

        return { success: true };
      }),

    // Get driver's average rating and reviews
    getDriverRatings: publicProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDriverRatings(input.driverId);
      }),

    // Check if ride has been rated
    checkRideRated: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .query(async ({ input }) => {
        const rating = await db.getRatingByRideId(input.rideId);
        return { rated: !!rating };
      }),
  }),

  location: router({
    // Driver: Update location
    update: driverProcedure
      .input(z.object({
        lat: z.string(),
        lng: z.string(),
        rideId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Update driver location in database
        await db.upsertDriverLocation({
          driverId: ctx.user.id,
          lat: input.lat,
          lng: input.lng,
        });
        
        // If driver is in an active ride, broadcast location to passenger
        if (input.rideId) {
          realtimeManager.notifyDriverLocationUpdate(input.rideId, {
            driverId: ctx.user.id,
            rideId: input.rideId,
            lat: input.lat,
            lng: input.lng,
          });
        }
        
        return { success: true };
      }),

    // Get driver location (for passengers tracking their ride)
    getDriver: protectedProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDriverLocation(input.driverId);
      }),
  }),

  admin: router({
    // Get all users
    getUsers: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    // Get all rides
    getRides: adminProcedure.query(async () => {
      return await db.getAllRides();
    }),

    // Get stats
    getStats: adminProcedure.query(async () => {
      const users = await db.getAllUsers();
      const rides = await db.getAllRides();

      return {
        totalUsers: users.length,
        totalPassengers: users.filter(u => u.role === "passenger").length,
        totalDrivers: users.filter(u => u.role === "driver").length,
        totalRides: rides.length,
        activeRides: rides.filter(r => r.status === "requested" || r.status === "accepted" || r.status === "in_progress").length,
        completedRides: rides.filter(r => r.status === "completed").length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
