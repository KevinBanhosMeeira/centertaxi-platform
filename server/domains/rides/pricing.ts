/**
 * Pricing Service - Calculates ride fares based on distance, time, and tenant settings
 */

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  subtotal: number;
  multiplier: number;
  total: number;
  currency: string;
}

export interface PricingInput {
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumFare: number;
  currency: string;
  surgePricing?: boolean;
}

/**
 * Calculate ride fare with breakdown
 */
export function calculateFare(input: PricingInput): FareBreakdown {
  const {
    distanceKm,
    durationMinutes,
    baseFare,
    pricePerKm,
    pricePerMinute,
    minimumFare,
    currency,
    surgePricing = false,
  } = input;

  // Calculate base components
  const distanceFare = distanceKm * pricePerKm;
  const timeFare = durationMinutes * pricePerMinute;
  const subtotal = baseFare + distanceFare + timeFare;

  // Apply surge pricing multiplier if enabled
  const multiplier = surgePricing ? getSurgePricingMultiplier() : 1.0;
  let total = subtotal * multiplier;

  // Apply minimum fare
  if (total < minimumFare) {
    total = minimumFare;
  }

  return {
    baseFare,
    distanceFare: parseFloat(distanceFare.toFixed(2)),
    timeFare: parseFloat(timeFare.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    multiplier,
    total: parseFloat(total.toFixed(2)),
    currency,
  };
}

/**
 * Get surge pricing multiplier based on current time
 * Returns 1.0 (no surge) or higher multiplier for peak hours
 */
function getSurgePricingMultiplier(): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Peak hours: weekdays 7-9am and 5-8pm
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isMorningPeak = hour >= 7 && hour < 9;
  const isEveningPeak = hour >= 17 && hour < 20;

  if (isWeekday && (isMorningPeak || isEveningPeak)) {
    return 1.5; // 50% surge
  }

  // Friday/Saturday nights: 10pm-2am
  const isWeekendNight = (dayOfWeek === 5 || dayOfWeek === 6) && (hour >= 22 || hour < 2);
  if (isWeekendNight) {
    return 1.8; // 80% surge
  }

  return 1.0; // No surge
}

/**
 * Format fare breakdown as JSON string for database storage
 */
export function serializeFareBreakdown(breakdown: FareBreakdown): string {
  return JSON.stringify(breakdown);
}

/**
 * Parse fare breakdown from JSON string
 */
export function parseFareBreakdown(json: string): FareBreakdown {
  return JSON.parse(json);
}
