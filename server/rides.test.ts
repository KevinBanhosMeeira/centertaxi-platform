import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPassengerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "passenger-test",
    email: "passenger@test.com",
    name: "Test Passenger",
    loginMethod: "manus",
    role: "passenger",
    phone: "11999999999",
    profileCompleted: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createDriverContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "driver-test",
    email: "driver@test.com",
    name: "Test Driver",
    loginMethod: "manus",
    role: "driver",
    phone: "11988888888",
    profileCompleted: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("rides router", () => {
  it("passenger can request a ride", async () => {
    const ctx = createPassengerContext();
    const caller = appRouter.createCaller(ctx);

    const ride = await caller.rides.request({
      originAddress: "Rua A, 123",
      originLat: "-23.5505",
      originLng: "-46.6333",
      destinationAddress: "Rua B, 456",
      destinationLat: "-23.5600",
      destinationLng: "-46.6400",
      distanceKm: "5.2",
      priceEstimate: "18.20",
    });

    expect(ride).toBeDefined();
    expect(ride.passengerId).toBe(1);
    expect(ride.status).toBe("requested");
    expect(ride.originAddress).toBe("Rua A, 123");
  });

  it("driver can get available rides", async () => {
    const ctx = createDriverContext();
    const caller = appRouter.createCaller(ctx);

    const rides = await caller.rides.getAvailable();

    expect(Array.isArray(rides)).toBe(true);
  });

  it("passenger can request a scheduled ride", async () => {
    const ctx = createPassengerContext();
    const caller = appRouter.createCaller(ctx);

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1);

    const ride = await caller.rides.request({
      originAddress: "Rua C, 789",
      originLat: "-23.5505",
      originLng: "-46.6333",
      destinationAddress: "Rua D, 101",
      destinationLat: "-23.5700",
      destinationLng: "-46.6500",
      distanceKm: "8.0",
      priceEstimate: "28.00",
      scheduledAt: scheduledDate.toISOString(),
      isScheduled: "1",
    });

    expect(ride).toBeDefined();
    expect(ride.passengerId).toBe(1);
    expect(ride.isScheduled).toBe(1);
    expect(ride.scheduledAt).toBeDefined();
  });

  it("driver cannot request a ride", async () => {
    const ctx = createDriverContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.rides.request({
        originAddress: "Rua A, 123",
        originLat: "-23.5505",
        originLng: "-46.6333",
        destinationAddress: "Rua B, 456",
        destinationLat: "-23.5600",
        destinationLng: "-46.6400",
        distanceKm: "5.2",
        priceEstimate: "18.20",
      })
    ).rejects.toThrow();
  });

  it("passenger cannot get available rides", async () => {
    const ctx = createPassengerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.rides.getAvailable()).rejects.toThrow();
  });
});

describe("profile router", () => {
  it("user can update profile", async () => {
    const ctx = createPassengerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.update({
      name: "Updated Name",
      phone: "11977777777",
    });

    expect(result.success).toBe(true);
  });

  it("user can complete profile", async () => {
    const ctx = createPassengerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.completeProfile({
      name: "Complete Name",
      phone: "11966666666",
      role: "passenger",
    });

    expect(result.success).toBe(true);
  });
});
