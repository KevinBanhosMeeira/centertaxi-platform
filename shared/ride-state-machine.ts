/**
 * Ride State Machine - Defines valid states and transitions
 */

export type RideStatus =
  | "requested"      // Passenger requested a ride
  | "matching"       // System is searching for available drivers
  | "offered"        // Ride offered to specific driver(s)
  | "accepted"       // Driver accepted the ride
  | "driver_en_route" // Driver is on the way to pickup passenger
  | "driver_arrived" // Driver arrived at pickup location
  | "in_progress"    // Ride started, passenger in vehicle
  | "completed"      // Ride finished successfully
  | "cancelled";     // Ride cancelled by passenger or driver

/**
 * Valid state transitions
 * Key: current state, Value: array of allowed next states
 */
export const RIDE_STATE_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  requested: ["matching", "cancelled"],
  matching: ["offered", "cancelled"],
  offered: ["accepted", "matching", "cancelled"], // Can go back to matching if driver rejects
  accepted: ["driver_en_route", "cancelled"],
  driver_en_route: ["driver_arrived", "cancelled"],
  driver_arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: RideStatus, to: RideStatus): boolean {
  const allowedTransitions = RIDE_STATE_TRANSITIONS[from];
  return allowedTransitions.includes(to);
}

/**
 * Get all valid next states for a given state
 */
export function getValidNextStates(currentState: RideStatus): RideStatus[] {
  return RIDE_STATE_TRANSITIONS[currentState];
}

/**
 * Check if a state is terminal (no further transitions possible)
 */
export function isTerminalState(state: RideStatus): boolean {
  return RIDE_STATE_TRANSITIONS[state].length === 0;
}

/**
 * Ride event types for audit log
 */
export type RideEventType =
  | "status_changed"
  | "driver_assigned"
  | "driver_location_updated"
  | "passenger_notified"
  | "driver_notified"
  | "price_calculated"
  | "payment_processed";

/**
 * Metadata for ride events (stored as JSON)
 */
export interface RideEventMetadata {
  reason?: string; // For cancellations
  previousDriverId?: number; // If driver changed
  estimatedArrival?: string; // ETA updates
  distanceTraveled?: string; // For in_progress updates
  [key: string]: any; // Allow additional fields
}
