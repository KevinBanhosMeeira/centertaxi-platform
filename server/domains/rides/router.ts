import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as service from "./service";
import {
  createRideSchema,
  updateRideStatusSchema,
  assignDriverSchema,
  getRideSchema,
  getActiveRideSchema,
} from "./types";

/**
 * tRPC router for rides domain
 */

export const ridesRouter = router({
  /**
   * Create a new ride
   */
  create: protectedProcedure
    .input(createRideSchema)
    .mutation(async ({ ctx, input }) => {
      return await service.createRide(ctx.user.id, input);
    }),

  /**
   * Update ride status (with state machine validation)
   */
  updateStatus: protectedProcedure
    .input(updateRideStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return await service.updateRideStatus(ctx.user.id, input);
    }),

  /**
   * Assign driver to ride
   */
  assignDriver: protectedProcedure
    .input(assignDriverSchema)
    .mutation(async ({ ctx, input }) => {
      return await service.assignDriver(input);
    }),

  /**
   * Get ride by ID
   */
  get: protectedProcedure
    .input(getRideSchema)
    .query(async ({ input }) => {
      return await service.getRide(input.rideId);
    }),

  /**
   * Get active ride for current user
   */
  getActive: protectedProcedure
    .input(getActiveRideSchema)
    .query(async ({ input }) => {
      return await service.getActiveRide(input.userId, input.role);
    }),

  /**
   * Get ride events (audit log)
   */
  getEvents: protectedProcedure
    .input(getRideSchema)
    .query(async ({ input }) => {
      return await service.getRideEvents(input.rideId);
    }),
});
