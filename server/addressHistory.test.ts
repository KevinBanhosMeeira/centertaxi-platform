import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-history",
    email: "history@test.com",
    name: "Test User History",
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

describe("Address History", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let userId: number;

  beforeAll(async () => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
    userId = 1;
  });

  it("should save an address to history", async () => {
    const result = await caller.addressHistory.save({
      address: "Av. Paulista, 1578 - Bela Vista, São Paulo - SP",
      lat: "-23.561684",
      lng: "-46.656139",
      placeId: "ChIJmzrzi0FZzpQRCYwm0WUqJXA",
    });

    expect(result.success).toBe(true);
  });

  it("should retrieve recent addresses", async () => {
    // Save multiple addresses
    await caller.addressHistory.save({
      address: "Shopping Eldorado - Av. Rebouças, 3970",
      lat: "-23.567890",
      lng: "-46.678901",
      placeId: "ChIJtest1",
    });

    await caller.addressHistory.save({
      address: "Rodoviária Tietê - Terminal Rodoviário",
      lat: "-23.515000",
      lng: "-46.626000",
      placeId: "ChIJtest2",
    });

    const addresses = await caller.addressHistory.getRecent();

    expect(addresses).toBeDefined();
    expect(Array.isArray(addresses)).toBe(true);
    expect(addresses.length).toBeGreaterThan(0);
    expect(addresses.length).toBeLessThanOrEqual(5);
  });

  it("should not duplicate addresses with same placeId", async () => {
    const addressData = {
      address: "Av. Paulista, 1578 - Bela Vista, São Paulo - SP",
      lat: "-23.561684",
      lng: "-46.656139",
      placeId: "ChIJmzrzi0FZzpQRCYwm0WUqJXA",
    };

    // Save the same address twice
    await caller.addressHistory.save(addressData);
    await caller.addressHistory.save(addressData);

    const addresses = await caller.addressHistory.getRecent();
    
    // Count how many times this placeId appears
    const count = addresses.filter(addr => addr.placeId === addressData.placeId).length;
    
    // Should only appear once
    expect(count).toBe(1);
  });

  it("should return addresses in reverse chronological order", async () => {
    const addresses = await caller.addressHistory.getRecent();

    if (addresses.length > 1) {
      for (let i = 0; i < addresses.length - 1; i++) {
        const current = new Date(addresses[i].createdAt).getTime();
        const next = new Date(addresses[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });
});
