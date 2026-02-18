import { describe, it, expect, beforeAll } from "vitest";
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

describe("Ratings System", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = createPassengerContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should create a rating for a completed ride", async () => {
    // Note: This test requires a completed ride in the database
    // In a real scenario, you would create a test ride first
    const result = await caller.ratings.create({
      rideId: 1,
      driverId: 2,
      rating: 5,
      comment: "Excelente motorista!",
    });

    expect(result.success).toBe(true);
  });

  it("should get driver ratings and calculate average", async () => {
    const ratings = await caller.ratings.getDriverRatings({
      driverId: 2,
    });

    expect(ratings).toBeDefined();
    expect(ratings).toHaveProperty("average");
    expect(ratings).toHaveProperty("count");
    expect(ratings).toHaveProperty("ratings");
    expect(Array.isArray(ratings.ratings)).toBe(true);
  });

  it("should check if a ride has been rated", async () => {
    const result = await caller.ratings.checkRideRated({
      rideId: 1,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("rated");
    expect(typeof result.rated).toBe("boolean");
  });

  it("should validate rating range (1-5)", async () => {
    try {
      await caller.ratings.create({
        rideId: 999,
        driverId: 2,
        rating: 6, // Invalid rating
        comment: "Test",
      });
      expect.fail("Should have thrown an error for invalid rating");
    } catch (error: any) {
      expect(error.message).toContain("Too big");
    }
  });
});
