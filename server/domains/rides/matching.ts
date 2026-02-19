import { getDb } from "../../db";
import { realtimeManager } from "../../realtime/websocket";
import { eq, and } from "drizzle-orm";
import { users, driverLocations } from "../../../drizzle/schema";

/**
 * Haversine formula to calculate distance between two lat/lng points
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

interface DriverWithDistance {
  driverId: number;
  distance: number;
  lat: string;
  lng: string;
  name: string;
}

/**
 * Find available drivers within radius and sort by distance
 */
export async function findNearbyDrivers(
  originLat: string,
  originLng: string,
  radiusKm: number = 5
): Promise<DriverWithDistance[]> {
  const db = await getDb();
  
  // Get all online drivers with their last known location
  if (!db) throw new Error("Database not initialized");
  
  const onlineDrivers = await db
    .select({
      driverId: users.id,
      name: users.name,
      lat: driverLocations.lat,
      lng: driverLocations.lng,
      updatedAt: driverLocations.updatedAt,
    })
    .from(users)
    .leftJoin(driverLocations, eq(users.id, driverLocations.driverId))
    .where(
      and(
        eq(users.role, "driver"),
        eq(users.driverStatus, "online")
      )
    );
  
  // Filter drivers with location and calculate distance
  const driversWithDistance: DriverWithDistance[] = [];
  
  for (const driver of onlineDrivers) {
    if (!driver.lat || !driver.lng) continue;
    
    const distance = calculateDistance(
      parseFloat(originLat),
      parseFloat(originLng),
      parseFloat(driver.lat),
      parseFloat(driver.lng)
    );
    
    // Only include drivers within radius
    if (distance <= radiusKm) {
      driversWithDistance.push({
        driverId: driver.driverId,
        distance,
        lat: driver.lat,
        lng: driver.lng,
        name: driver.name || "Motorista",
      });
    }
  }
  
  // Sort by distance (closest first)
  driversWithDistance.sort((a, b) => a.distance - b.distance);
  
  return driversWithDistance;
}

/**
 * Notify drivers about new ride offer
 */
export async function notifyDriversAboutRide(
  rideId: number,
  originLat: string,
  originLng: string,
  originAddress: string,
  destinationAddress: string,
  distanceKm: string,
  priceEstimate: string,
  maxDrivers: number = 5
): Promise<number> {
  // Find nearby drivers
  const nearbyDrivers = await findNearbyDrivers(originLat, originLng);
  
  // Limit to maxDrivers
  const driversToNotify = nearbyDrivers.slice(0, maxDrivers);
  
  console.log(`[Matching] Found ${nearbyDrivers.length} drivers within radius, notifying ${driversToNotify.length}`);
  
  // Send notification to each driver
  for (const driver of driversToNotify) {
    realtimeManager.notifyRideOffered(driver.driverId, {
      rideId,
      originLat,
      originLng,
      originAddress,
      destinationAddress,
      distanceKm,
      priceEstimate,
      distanceToPickup: driver.distance.toFixed(2),
    });
    
    console.log(`[Matching] Notified driver ${driver.driverId} (${driver.name}) - ${driver.distance.toFixed(2)}km away`);
  }
  
  return driversToNotify.length;
}

/**
 * Re-match ride if no driver accepted within timeout
 */
export async function scheduleReMatching(
  rideId: number,
  originLat: string,
  originLng: string,
  originAddress: string,
  destinationAddress: string,
  distanceKm: string,
  priceEstimate: string,
  timeoutSeconds: number = 30
): Promise<void> {
  setTimeout(async () => {
    const db = await getDb();
    if (!db) {
      console.error("[Matching] Database not initialized");
      return;
    }
    
    // Check if ride is still in "requested" status
    const [ride] = await db
      .select()
      .from((await import("../../../drizzle/schema")).rides)
      .where(eq((await import("../../../drizzle/schema")).rides.id, rideId));
    
    if (!ride || ride.status !== "requested") {
      console.log(`[Matching] Ride ${rideId} no longer needs matching (status: ${ride?.status})`);
      return;
    }
    
    console.log(`[Matching] Re-matching ride ${rideId} after timeout`);
    
    // Notify more drivers (next batch)
    await notifyDriversAboutRide(
      rideId,
      originLat,
      originLng,
      originAddress,
      destinationAddress,
      distanceKm,
      priceEstimate,
      10 // Increase to 10 drivers on re-match
    );
  }, timeoutSeconds * 1000);
}
