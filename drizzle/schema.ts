import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  tenantId: int("tenantId"), // Multi-tenant support - will be required after migration
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["passenger", "driver", "admin"]).default("passenger").notNull(),
  phone: varchar("phone", { length: 20 }),
  profileCompleted: int("profileCompleted").default(0).notNull(), // 0 = incomplete, 1 = complete
  driverStatus: mysqlEnum("driverStatus", ["offline", "online", "busy"]).default("offline"), // For drivers only
  ratingAvg: varchar("ratingAvg", { length: 5 }), // Average rating (e.g., "4.85")
  ratingCount: int("ratingCount").default(0), // Total number of ratings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Rides table - stores all ride requests and their status
 */
export const rides = mysqlTable("rides", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"), // Multi-tenant support - will be required after migration
  passengerId: int("passengerId").notNull().references(() => users.id),
  driverId: int("driverId").references(() => users.id),
  status: mysqlEnum("status", ["requested", "matching", "offered", "accepted", "driver_en_route", "driver_arrived", "in_progress", "completed", "cancelled"]).default("requested").notNull(),
  originAddress: text("originAddress").notNull(),
  originLat: varchar("originLat", { length: 20 }).notNull(),
  originLng: varchar("originLng", { length: 20 }).notNull(),
  destinationAddress: text("destinationAddress").notNull(),
  destinationLat: varchar("destinationLat", { length: 20 }).notNull(),
  destinationLng: varchar("destinationLng", { length: 20 }).notNull(),
  distanceKm: varchar("distanceKm", { length: 10 }),
  durationMinutes: int("durationMinutes"), // Estimated duration in minutes
  priceEstimate: varchar("priceEstimate", { length: 10 }),
  finalPrice: varchar("finalPrice", { length: 10 }),
  fareBreakdown: text("fareBreakdown"), // JSON: { baseFare, distanceFare, timeFare, total, multiplier }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  cancelledAt: timestamp("cancelledAt"),
  scheduledAt: timestamp("scheduledAt"),
  isScheduled: int("isScheduled").default(0).notNull(), // 0 = immediate, 1 = scheduled
});

export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;

/**
 * Driver locations - tracks real-time location of drivers
 */
export const driverLocations = mysqlTable("driverLocations", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => users.id),
  lat: varchar("lat", { length: 20 }).notNull(),
  lng: varchar("lng", { length: 20 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverLocation = typeof driverLocations.$inferSelect;
export type InsertDriverLocation = typeof driverLocations.$inferInsert;

/**
 * Address history - stores recent addresses searched by users
 */
export const addressHistory = mysqlTable("addressHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  address: text("address").notNull(),
  lat: varchar("lat", { length: 20 }).notNull(),
  lng: varchar("lng", { length: 20 }).notNull(),
  placeId: varchar("placeId", { length: 255 }), // Google Places ID for deduplication
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AddressHistory = typeof addressHistory.$inferSelect;
export type InsertAddressHistory = typeof addressHistory.$inferInsert;

/**
 * Ratings - stores passenger ratings for drivers after ride completion
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull().references(() => rides.id),
  passengerId: int("passengerId").notNull().references(() => users.id),
  driverId: int("driverId").notNull().references(() => users.id),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Tenants - white-label platform support
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  logo: text("logo"), // URL to logo image
  primaryColor: varchar("primaryColor", { length: 7 }).default("#003DA5").notNull(), // Hex color
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#E63946").notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }), // e.g., "SP"
  country: varchar("country", { length: 2 }).default("BR").notNull(),
  active: int("active").default(1).notNull(), // 0 = inactive, 1 = active
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Tenant Settings - configurable settings per tenant
 */
export const tenantSettings = mysqlTable("tenantSettings", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  baseFare: varchar("baseFare", { length: 10 }).default("5.00").notNull(), // Base fare in local currency
  pricePerKm: varchar("pricePerKm", { length: 10 }).default("2.50").notNull(),
  pricePerMinute: varchar("pricePerMinute", { length: 10 }).default("0.50").notNull(),
  minimumFare: varchar("minimumFare", { length: 10 }).default("10.00").notNull(),
  commissionPercent: int("commissionPercent").default(20).notNull(), // Platform commission %
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  maxSearchRadiusKm: int("maxSearchRadiusKm").default(10).notNull(), // Max radius to search for drivers
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TenantSettings = typeof tenantSettings.$inferSelect;
export type InsertTenantSettings = typeof tenantSettings.$inferInsert;

/**
 * Vehicles - driver vehicle information
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => users.id),
  tenantId: int("tenantId").notNull().references(() => tenants.id),
  plate: varchar("plate", { length: 20 }).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(), // e.g., "Toyota"
  model: varchar("model", { length: 100 }).notNull(), // e.g., "Corolla"
  year: int("year").notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  seats: int("seats").default(4).notNull(),
  active: int("active").default(1).notNull(), // 0 = inactive, 1 = active
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Ride Events - audit log of all ride state transitions
 */
export const rideEvents = mysqlTable("rideEvents", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull().references(() => rides.id),
  fromStatus: varchar("fromStatus", { length: 50 }),
  toStatus: varchar("toStatus", { length: 50 }).notNull(),
  triggeredBy: int("triggeredBy").references(() => users.id), // User who triggered the transition
  lat: varchar("lat", { length: 20 }), // Location at time of event
  lng: varchar("lng", { length: 20 }),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RideEvent = typeof rideEvents.$inferSelect;
export type InsertRideEvent = typeof rideEvents.$inferInsert;