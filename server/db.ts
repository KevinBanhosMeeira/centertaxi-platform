import { eq, and, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, rides, InsertRide, Ride, driverLocations, InsertDriverLocation } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.profileCompleted !== undefined) {
      values.profileCompleted = user.profileCompleted;
      updateSet.profileCompleted = user.profileCompleted;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: { name?: string; phone?: string; role?: "passenger" | "driver" | "admin"; profileCompleted?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(data).where(eq(users.id, userId));
}

// Ride helpers
export async function createRide(data: InsertRide): Promise<Ride> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(rides).values(data);
  const rideId = Number(result[0].insertId);
  
  const ride = await db.select().from(rides).where(eq(rides.id, rideId)).limit(1);
  return ride[0]!;
}

export async function getRideById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(rides).where(eq(rides.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAvailableRides() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides).where(eq(rides.status, "requested")).orderBy(desc(rides.createdAt));
}

export async function getRidesByPassenger(passengerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides).where(eq(rides.passengerId, passengerId)).orderBy(desc(rides.createdAt));
}

export async function getRidesByDriver(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides).where(eq(rides.driverId, driverId)).orderBy(desc(rides.createdAt));
}

export async function getActiveRideForPassenger(passengerId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(rides).where(
    and(
      eq(rides.passengerId, passengerId),
      or(
        eq(rides.status, "requested"),
        eq(rides.status, "accepted"),
        eq(rides.status, "in_progress")
      )
    )
  ).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getActiveRideForDriver(driverId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(rides).where(
    and(
      eq(rides.driverId, driverId),
      or(
        eq(rides.status, "accepted"),
        eq(rides.status, "in_progress")
      )
    )
  ).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateRideStatus(rideId: number, status: Ride["status"], driverId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<Ride> = { status };
  
  if (status === "accepted" && driverId) {
    updateData.driverId = driverId;
    updateData.acceptedAt = new Date();
  } else if (status === "in_progress") {
    updateData.startedAt = new Date();
  } else if (status === "completed") {
    updateData.completedAt = new Date();
  } else if (status === "cancelled") {
    updateData.cancelledAt = new Date();
  }

  await db.update(rides).set(updateData).where(eq(rides.id, rideId));
}

export async function getAllRides() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rides).orderBy(desc(rides.createdAt));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// Driver location helpers
export async function upsertDriverLocation(data: InsertDriverLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(driverLocations).where(eq(driverLocations.driverId, data.driverId)).limit(1);

  if (existing.length > 0) {
    await db.update(driverLocations).set({ lat: data.lat, lng: data.lng }).where(eq(driverLocations.driverId, data.driverId));
  } else {
    await db.insert(driverLocations).values(data);
  }
}

export async function getDriverLocation(driverId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(driverLocations).where(eq(driverLocations.driverId, driverId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
