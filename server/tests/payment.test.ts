import { beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { __resetForTests } from "../db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "passenger" | "driver", id: number): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `${role}-${id}`,
    email: `${role}${id}@test.com`,
    name: `${role}-${id}`,
    loginMethod: "manus",
    role,
    phone: "11999999999",
    profileCompleted: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("ride flow end-to-end", () => {
  beforeEach(() => {
    __resetForTests();
  });

  it("runs request -> accept -> start -> complete", async () => {
    const passengerCaller = appRouter.createCaller(createContext("passenger", 1));
    const driverCaller = appRouter.createCaller(createContext("driver", 2));

    const ride = await passengerCaller.rides.request({
      originAddress: "Rua A, 123",
      originLat: "-23.5505",
      originLng: "-46.6333",
      destinationAddress: "Rua B, 456",
      destinationLat: "-23.5600",
      destinationLng: "-46.6400",
      distanceKm: "5.2",
      priceEstimate: "18.20",
    });

    expect(ride.status).toBe("requested");

    await driverCaller.rides.accept({ rideId: ride.id });
    let updatedRide = await passengerCaller.rides.getById({ rideId: ride.id });
    expect(updatedRide.status).toBe("accepted");

    await driverCaller.rides.start({ rideId: ride.id });
    updatedRide = await passengerCaller.rides.getById({ rideId: ride.id });
    expect(updatedRide.status).toBe("in_progress");

    await driverCaller.rides.complete({ rideId: ride.id });
    updatedRide = await passengerCaller.rides.getById({ rideId: ride.id });
    expect(updatedRide.status).toBe("completed");
  });
});
