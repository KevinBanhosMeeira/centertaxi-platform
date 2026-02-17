import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

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
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if passenger already has an active ride
        const activeRide = await db.getActiveRideForPassenger(ctx.user.id);
        if (activeRide) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Você já tem uma corrida ativa" 
          });
        }

        const ride = await db.createRide({
          passengerId: ctx.user.id,
          ...input,
        });

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

  location: router({
    // Driver: update location
    update: driverProcedure
      .input(z.object({
        lat: z.string(),
        lng: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertDriverLocation({
          driverId: ctx.user.id,
          lat: input.lat,
          lng: input.lng,
        });
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
