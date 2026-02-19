import { getDb } from "../../db";
import { rides, rideEvents, type InsertRide, type InsertRideEvent } from "../../../drizzle/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import type { RideStatus } from "../../../shared/ride-state-machine";

/**
 * Repository for ride data access
 */

export async function createRide(data: InsertRide) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [ride] = await db.insert(rides).values(data);
  return ride;
}

export async function getRideById(rideId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [ride] = await db.select().from(rides).where(eq(rides.id, rideId));
  return ride;
}

export async function updateRideStatus(rideId: number, newStatus: RideStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rides).set({ status: newStatus }).where(eq(rides.id, rideId));
}

export async function assignDriverToRide(rideId: number, driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rides).set({ driverId }).where(eq(rides.id, rideId));
}

export async function getActiveRideForPassenger(passengerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [ride] = await db
    .select()
    .from(rides)
    .where(
      and(
        eq(rides.passengerId, passengerId),
        or(
          eq(rides.status, "requested"),
          eq(rides.status, "matching"),
          eq(rides.status, "offered"),
          eq(rides.status, "accepted"),
          eq(rides.status, "driver_en_route"),
          eq(rides.status, "driver_arrived"),
          eq(rides.status, "in_progress")
        )
      )
    )
    .orderBy(rides.createdAt)
    .limit(1);
  return ride;
}

export async function getActiveRideForDriver(driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [ride] = await db
    .select()
    .from(rides)
    .where(
      and(
        eq(rides.driverId, driverId),
        or(
          eq(rides.status, "accepted"),
          eq(rides.status, "driver_en_route"),
          eq(rides.status, "driver_arrived"),
          eq(rides.status, "in_progress")
        )
      )
    )
    .orderBy(rides.createdAt)
    .limit(1);
  return ride;
}

export async function getRidesForMatching(tenantId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Get rides that are in "matching" status and don't have a driver assigned yet
  const query = db
    .select()
    .from(rides)
    .where(
      and(
        eq(rides.status, "matching"),
        isNull(rides.driverId),
        tenantId ? eq(rides.tenantId, tenantId) : undefined
      )
    )
    .orderBy(rides.createdAt);
  
  return await query;
}

/**
 * Ride Events Repository
 */

export async function createRideEvent(data: InsertRideEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(rideEvents).values(data);
}

export async function getRideEvents(rideId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(rideEvents)
    .where(eq(rideEvents.rideId, rideId))
    .orderBy(rideEvents.createdAt);
}

export async function getLatestRideEvent(rideId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [event] = await db
    .select()
    .from(rideEvents)
    .where(eq(rideEvents.rideId, rideId))
    .orderBy(rideEvents.createdAt)
    .limit(1);
  return event;
}
