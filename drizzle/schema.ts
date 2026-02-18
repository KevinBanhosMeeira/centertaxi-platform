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
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["passenger", "driver", "admin"]).default("passenger").notNull(),
  phone: varchar("phone", { length: 20 }),
  profileCompleted: int("profileCompleted").default(0).notNull(), // 0 = incomplete, 1 = complete
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
  passengerId: int("passengerId").notNull().references(() => users.id),
  driverId: int("driverId").references(() => users.id),
  status: mysqlEnum("status", ["requested", "accepted", "in_progress", "completed", "cancelled"]).default("requested").notNull(),
  originAddress: text("originAddress").notNull(),
  originLat: varchar("originLat", { length: 20 }).notNull(),
  originLng: varchar("originLng", { length: 20 }).notNull(),
  destinationAddress: text("destinationAddress").notNull(),
  destinationLat: varchar("destinationLat", { length: 20 }).notNull(),
  destinationLng: varchar("destinationLng", { length: 20 }).notNull(),
  distanceKm: varchar("distanceKm", { length: 10 }),
  priceEstimate: varchar("priceEstimate", { length: 10 }),
  finalPrice: varchar("finalPrice", { length: 10 }),
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