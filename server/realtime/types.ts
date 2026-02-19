import type { RideStatus } from "../../shared/ride-state-machine";

/**
 * WebSocket message types
 */

export type WSMessageType =
  | "auth"
  | "ride_offered"
  | "ride_accepted"
  | "ride_status_changed"
  | "driver_location_update"
  | "passenger_location_update"
  | "driver_online"
  | "driver_offline"
  | "error"
  | "ping"
  | "pong";

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: number;
}

export interface WSAuthPayload {
  userId: number;
  role: "passenger" | "driver" | "admin";
  token?: string;
}

export interface WSRideOfferedPayload {
  rideId: number;
  passengerId: number;
  originAddress: string;
  destinationAddress: string;
  distanceKm: string;
  priceEstimate: string;
  originLat: string;
  originLng: string;
}

export interface WSRideStatusChangedPayload {
  rideId: number;
  oldStatus: RideStatus;
  newStatus: RideStatus;
  driverId?: number;
  passengerId?: number;
}

export interface WSDriverLocationPayload {
  driverId: number;
  rideId?: number;
  lat: string;
  lng: string;
}

export interface WSPassengerLocationPayload {
  passengerId: number;
  rideId: number;
  lat: string;
  lng: string;
}

/**
 * Connected client info
 */
export interface ConnectedClient {
  userId: number;
  role: "passenger" | "driver" | "admin";
  activeRideId?: number;
  tenantId?: number;
}
