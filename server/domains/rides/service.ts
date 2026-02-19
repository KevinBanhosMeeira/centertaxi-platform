import { TRPCError } from "@trpc/server";
import { isValidTransition, type RideStatus } from "../../../shared/ride-state-machine";
import * as repository from "./repository";
import type { CreateRideInput, UpdateRideStatusInput, AssignDriverInput } from "./types";

/**
 * Business logic for rides domain
 */

export async function createRide(passengerId: number, input: CreateRideInput) {
  const ride = await repository.createRide({
    passengerId,
    status: "requested",
    originAddress: input.originAddress,
    originLat: input.originLat,
    originLng: input.originLng,
    destinationAddress: input.destinationAddress,
    destinationLat: input.destinationLat,
    destinationLng: input.destinationLng,
    distanceKm: input.distanceKm,
    priceEstimate: input.priceEstimate,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    isScheduled: input.scheduledAt ? 1 : 0,
  });

  // Log ride creation event
  await repository.createRideEvent({
    rideId: ride.insertId,
    fromStatus: null,
    toStatus: "requested",
    triggeredBy: passengerId,
    metadata: JSON.stringify({ action: "ride_created" }),
  });

  return ride;
}

export async function updateRideStatus(userId: number, input: UpdateRideStatusInput) {
  const ride = await repository.getRideById(input.rideId);
  
  if (!ride) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Ride not found",
    });
  }

  const currentStatus = ride.status as RideStatus;
  const newStatus = input.newStatus as RideStatus;

  // Validate state transition
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid state transition from ${currentStatus} to ${newStatus}`,
    });
  }

  // Update ride status
  await repository.updateRideStatus(input.rideId, newStatus);

  // Log state transition event
  await repository.createRideEvent({
    rideId: input.rideId,
    fromStatus: currentStatus,
    toStatus: newStatus,
    triggeredBy: userId,
    lat: input.lat,
    lng: input.lng,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  });

  return { success: true, ride: await repository.getRideById(input.rideId) };
}

export async function assignDriver(input: AssignDriverInput) {
  const ride = await repository.getRideById(input.rideId);
  
  if (!ride) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Ride not found",
    });
  }

  if (ride.driverId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Ride already has a driver assigned",
    });
  }

  await repository.assignDriverToRide(input.rideId, input.driverId);

  // Log driver assignment event
  await repository.createRideEvent({
    rideId: input.rideId,
    fromStatus: ride.status,
    toStatus: ride.status, // Status doesn't change, just driver assignment
    triggeredBy: input.driverId,
    metadata: JSON.stringify({ action: "driver_assigned", driverId: input.driverId }),
  });

  return { success: true };
}

export async function getRide(rideId: number) {
  const ride = await repository.getRideById(rideId);
  
  if (!ride) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Ride not found",
    });
  }

  return ride;
}

export async function getActiveRide(userId: number, role: "passenger" | "driver") {
  if (role === "passenger") {
    return await repository.getActiveRideForPassenger(userId);
  } else {
    return await repository.getActiveRideForDriver(userId);
  }
}

export async function getRideEvents(rideId: number) {
  return await repository.getRideEvents(rideId);
}
