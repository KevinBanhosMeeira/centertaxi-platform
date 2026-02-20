import { eq, and, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, rides, InsertRide, Ride, driverLocations, InsertDriverLocation, addressHistory, InsertAddressHistory, ratings, InsertRating, tenantSettings, TenantSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

type InMemoryStore = {
  users: Array<any>;
  rides: Array<Ride>;
  driverLocations: Array<any>;
  addressHistory: Array<any>;
  ratings: Array<any>;
  tenantSettings: Array<TenantSettings>;
  nextIds: {
    user: number;
    ride: number;
    driverLocation: number;
    addressHistory: number;
    rating: number;
    tenantSettings: number;
  };
};

const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  id: 1,
  tenantId: 1,
  baseFare: "5.00",
  pricePerKm: "2.50",
  pricePerMinute: "0.50",
  minimumFare: "10.00",
  commissionPercent: 20,
  currency: "BRL",
  maxSearchRadiusKm: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inMemory: InMemoryStore = {
  users: [],
  rides: [],
  driverLocations: [],
  addressHistory: [],
  ratings: [],
  tenantSettings: [DEFAULT_TENANT_SETTINGS],
  nextIds: {
    user: 1,
    ride: 1,
    driverLocation: 1,
    addressHistory: 1,
    rating: 1,
    tenantSettings: 2,
  },
};


export function __resetForTests() {
  inMemory.users = [];
  inMemory.rides = [];
  inMemory.driverLocations = [];
  inMemory.addressHistory = [];
  inMemory.ratings = [];
  inMemory.tenantSettings = [{ ...DEFAULT_TENANT_SETTINGS }];
  inMemory.nextIds = {
    user: 1,
    ride: 1,
    driverLocation: 1,
    addressHistory: 1,
    rating: 1,
    tenantSettings: 2,
  };
}

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
  if (!db) {
    const existing = inMemory.users.find((u) => u.id === userId);
    if (existing) {
      Object.assign(existing, data, { updatedAt: new Date() });
    } else {
      inMemory.users.push({
        id: userId,
        openId: `in-memory-${userId}`,
        name: data.name ?? null,
        email: null,
        loginMethod: "manus",
        role: data.role ?? "passenger",
        phone: data.phone ?? null,
        profileCompleted: data.profileCompleted ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
    }
    return;
  }

  await db.update(users).set(data).where(eq(users.id, userId));
}

// Ride helpers
export async function createRide(data: InsertRide): Promise<Ride> {
  const db = await getDb();
  if (!db) {
    const ride: Ride = {
      id: inMemory.nextIds.ride++,
      tenantId: data.tenantId ?? null,
      passengerId: data.passengerId,
      driverId: data.driverId ?? null,
      status: data.status ?? "requested",
      originAddress: data.originAddress,
      originLat: data.originLat,
      originLng: data.originLng,
      destinationAddress: data.destinationAddress,
      destinationLat: data.destinationLat,
      destinationLng: data.destinationLng,
      distanceKm: data.distanceKm ?? null,
      durationMinutes: data.durationMinutes ?? null,
      priceEstimate: data.priceEstimate ?? null,
      finalPrice: data.finalPrice ?? null,
      fareBreakdown: data.fareBreakdown ?? null,
      createdAt: new Date(),
      acceptedAt: null,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      scheduledAt: data.scheduledAt ?? null,
      isScheduled: data.isScheduled ?? 0,
    };
    inMemory.rides.push(ride);
    return ride;
  }

  const result = await db.insert(rides).values(data);
  const rideId = Number(result[0].insertId);
  
  const ride = await db.select().from(rides).where(eq(rides.id, rideId)).limit(1);
  return ride[0]!;
}

export async function getRideById(id: number) {
  const db = await getDb();
  if (!db) return inMemory.rides.find((ride) => ride.id === id);

  const result = await db.select().from(rides).where(eq(rides.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAvailableRides() {
  const db = await getDb();
  if (!db) return inMemory.rides.filter((ride) => ride.status === "requested").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return await db.select().from(rides).where(eq(rides.status, "requested")).orderBy(desc(rides.createdAt));
}

export async function getRidesByPassenger(passengerId: number) {
  const db = await getDb();
  if (!db) return inMemory.rides.filter((ride) => ride.passengerId === passengerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return await db.select().from(rides).where(eq(rides.passengerId, passengerId)).orderBy(desc(rides.createdAt));
}

export async function getRidesByDriver(driverId: number) {
  const db = await getDb();
  if (!db) return inMemory.rides.filter((ride) => ride.driverId === driverId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return await db.select().from(rides).where(eq(rides.driverId, driverId)).orderBy(desc(rides.createdAt));
}

export async function getActiveRideForPassenger(passengerId: number) {
  const db = await getDb();
  if (!db) {
    return inMemory.rides.find((ride) =>
      ride.passengerId === passengerId && ["requested", "accepted", "in_progress"].includes(ride.status),
    ) ?? null;
  }

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
  if (!db) {
    return inMemory.rides.find((ride) =>
      ride.driverId === driverId && ["accepted", "in_progress"].includes(ride.status),
    ) ?? null;
  }

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
  if (!db) {
    const ride = inMemory.rides.find((r) => r.id === rideId);
    if (!ride) return;
    ride.status = status;
    if (status === "accepted" && driverId) {
      ride.driverId = driverId;
      ride.acceptedAt = new Date();
    } else if (status === "in_progress") {
      ride.startedAt = new Date();
    } else if (status === "completed") {
      ride.completedAt = new Date();
    } else if (status === "cancelled") {
      ride.cancelledAt = new Date();
    }
    return;
  }

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
  if (!db) return [...inMemory.rides].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return await db.select().from(rides).orderBy(desc(rides.createdAt));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [...inMemory.users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// Driver location helpers
export async function upsertDriverLocation(data: InsertDriverLocation) {
  const db = await getDb();
  if (!db) {
    const existing = inMemory.driverLocations.find((loc) => loc.driverId === data.driverId);
    if (existing) {
      existing.lat = data.lat;
      existing.lng = data.lng;
      existing.updatedAt = new Date();
    } else {
      inMemory.driverLocations.push({
        id: inMemory.nextIds.driverLocation++,
        driverId: data.driverId,
        lat: data.lat,
        lng: data.lng,
        updatedAt: new Date(),
      });
    }
    return;
  }

  const existing = await db.select().from(driverLocations).where(eq(driverLocations.driverId, data.driverId)).limit(1);

  if (existing.length > 0) {
    await db.update(driverLocations).set({ lat: data.lat, lng: data.lng }).where(eq(driverLocations.driverId, data.driverId));
  } else {
    await db.insert(driverLocations).values(data);
  }
}

export async function getDriverLocation(driverId: number) {
  const db = await getDb();
  if (!db) return inMemory.driverLocations.find((loc) => loc.driverId === driverId);

  const result = await db.select().from(driverLocations).where(eq(driverLocations.driverId, driverId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Address history helpers
export async function saveAddressToHistory(data: InsertAddressHistory) {
  const db = await getDb();
  if (!db) {
    if (data.placeId) {
      const existing = inMemory.addressHistory.find((item) => item.userId === data.userId && item.placeId === data.placeId);
      if (existing) {
        existing.createdAt = new Date();
        return;
      }
    }

    inMemory.addressHistory.push({
      id: inMemory.nextIds.addressHistory++,
      userId: data.userId,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      placeId: data.placeId ?? null,
      createdAt: new Date(),
    });
    return;
  }

  // Check if address already exists for this user (by placeId if available)
  if (data.placeId) {
    const existing = await db.select().from(addressHistory)
      .where(and(
        eq(addressHistory.userId, data.userId),
        eq(addressHistory.placeId, data.placeId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update the timestamp to move it to the top
      await db.update(addressHistory)
        .set({ createdAt: new Date() })
        .where(eq(addressHistory.id, existing[0].id));
      return;
    }
  }

  // Insert new address
  await db.insert(addressHistory).values(data);
}

export async function getRecentAddresses(userId: number) {
  const db = await getDb();
  if (!db) {
    return inMemory.addressHistory
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
  }

  return await db.select()
    .from(addressHistory)
    .where(eq(addressHistory.userId, userId))
    .orderBy(desc(addressHistory.createdAt))
    .limit(5);
}

// ============================================================================
// Ratings Functions
// ============================================================================

export async function createRating(data: InsertRating) {
  const db = await getDb();
  if (!db) {
    inMemory.ratings.push({
      id: inMemory.nextIds.rating++,
      rideId: data.rideId,
      passengerId: data.passengerId,
      driverId: data.driverId,
      rating: data.rating,
      comment: data.comment ?? null,
      createdAt: new Date(),
    });
    return;
  }

  await db.insert(ratings).values(data);
}

export async function getRatingByRideId(rideId: number) {
  const db = await getDb();
  if (!db) return inMemory.ratings.find((rating) => rating.rideId === rideId) || null;

  const result = await db.select()
    .from(ratings)
    .where(eq(ratings.rideId, rideId))
    .limit(1);

  return result[0] || null;
}

export async function getDriverRatings(driverId: number) {
  const db = await getDb();
  if (!db) {
    const driverRatings = inMemory.ratings
      .filter((rating) => rating.driverId === driverId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (driverRatings.length === 0) {
      return { average: 0, count: 0, ratings: [] };
    }

    const sum = driverRatings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / driverRatings.length;

    return {
      average: Math.round(average * 10) / 10,
      count: driverRatings.length,
      ratings: driverRatings,
    };
  }

  const driverRatings = await db.select()
    .from(ratings)
    .where(eq(ratings.driverId, driverId))
    .orderBy(desc(ratings.createdAt));

  if (driverRatings.length === 0) {
    return { average: 0, count: 0, ratings: [] };
  }

  const sum = driverRatings.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / driverRatings.length;

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count: driverRatings.length,
    ratings: driverRatings,
  };
}

// ============================================================================
// Tenant Settings Functions
// ============================================================================

export async function getTenantSettings(tenantId: number): Promise<TenantSettings | null> {
  const db = await getDb();
  if (!db) {
    return inMemory.tenantSettings.find((settings) => settings.tenantId === tenantId) ?? null;
  }

  const result = await db.select()
    .from(tenantSettings)
    .where(eq(tenantSettings.tenantId, tenantId))
    .limit(1);

  return result[0] || null;
}
