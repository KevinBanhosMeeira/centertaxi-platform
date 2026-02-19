import { z } from "zod";
import type { RideStatus } from "../../../shared/ride-state-machine";

/**
 * Zod schemas for ride operations
 */

export const createRideSchema = z.object({
  originAddress: z.string().min(1),
  originLat: z.string(),
  originLng: z.string(),
  destinationAddress: z.string().min(1),
  destinationLat: z.string(),
  destinationLng: z.string(),
  distanceKm: z.string().optional(),
  priceEstimate: z.string().optional(),
  scheduledAt: z.number().optional(), // Unix timestamp in ms
});

export const updateRideStatusSchema = z.object({
  rideId: z.number(),
  newStatus: z.enum([
    "requested",
    "matching",
    "offered",
    "accepted",
    "driver_en_route",
    "driver_arrived",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  lat: z.string().optional(),
  lng: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const assignDriverSchema = z.object({
  rideId: z.number(),
  driverId: z.number(),
});

export const getRideSchema = z.object({
  rideId: z.number(),
});

export const getActiveRideSchema = z.object({
  userId: z.number(),
  role: z.enum(["passenger", "driver"]),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type UpdateRideStatusInput = z.infer<typeof updateRideStatusSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
export type GetRideInput = z.infer<typeof getRideSchema>;
export type GetActiveRideInput = z.infer<typeof getActiveRideSchema>;
