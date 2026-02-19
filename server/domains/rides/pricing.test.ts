import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateFare, serializeFareBreakdown, parseFareBreakdown } from "./pricing";

describe("Pricing Service", () => {
  describe("calculateFare", () => {
    it("should calculate basic fare correctly", () => {
      const result = calculateFare({
        distanceKm: 10,
        durationMinutes: 20,
        baseFare: 5,
        pricePerKm: 2.5,
        pricePerMinute: 0.5,
        minimumFare: 10,
        currency: "BRL",
        surgePricing: false,
      });

      expect(result.baseFare).toBe(5);
      expect(result.distanceFare).toBe(25); // 10 km * 2.5
      expect(result.timeFare).toBe(10); // 20 min * 0.5
      expect(result.subtotal).toBe(40); // 5 + 25 + 10
      expect(result.multiplier).toBe(1.0);
      expect(result.total).toBe(40);
      expect(result.currency).toBe("BRL");
    });

    it("should apply minimum fare when total is below minimum", () => {
      const result = calculateFare({
        distanceKm: 1,
        durationMinutes: 2,
        baseFare: 5,
        pricePerKm: 2.5,
        pricePerMinute: 0.5,
        minimumFare: 15,
        currency: "BRL",
        surgePricing: false,
      });

      // Subtotal: 5 + 2.5 + 1 = 8.5, but minimum is 15
      expect(result.subtotal).toBe(8.5);
      expect(result.total).toBe(15);
    });

    it("should apply surge pricing multiplier during peak hours", () => {
      // Mock date to be weekday morning peak (8am)
      const mockDate = new Date("2026-02-19T08:00:00");
      vi.setSystemTime(mockDate);

      const result = calculateFare({
        distanceKm: 10,
        durationMinutes: 20,
        baseFare: 5,
        pricePerKm: 2.5,
        pricePerMinute: 0.5,
        minimumFare: 10,
        currency: "BRL",
        surgePricing: true,
      });

      expect(result.multiplier).toBe(1.5); // 50% surge
      expect(result.subtotal).toBe(40);
      expect(result.total).toBe(60); // 40 * 1.5
    });

    it("should apply weekend night surge pricing", () => {
      // Mock date to be Friday night (11pm)
      const mockDate = new Date("2026-02-20T23:00:00"); // Friday
      vi.setSystemTime(mockDate);

      const result = calculateFare({
        distanceKm: 10,
        durationMinutes: 20,
        baseFare: 5,
        pricePerKm: 2.5,
        pricePerMinute: 0.5,
        minimumFare: 10,
        currency: "BRL",
        surgePricing: true,
      });

      expect(result.multiplier).toBe(1.8); // 80% surge
      expect(result.total).toBe(72); // 40 * 1.8
    });

    it("should not apply surge pricing when disabled", () => {
      // Mock date to be peak hour
      const mockDate = new Date("2026-02-19T08:00:00");
      vi.setSystemTime(mockDate);

      const result = calculateFare({
        distanceKm: 10,
        durationMinutes: 20,
        baseFare: 5,
        pricePerKm: 2.5,
        pricePerMinute: 0.5,
        minimumFare: 10,
        currency: "BRL",
        surgePricing: false,
      });

      expect(result.multiplier).toBe(1.0);
      expect(result.total).toBe(40);
    });

    it("should round values to 2 decimal places", () => {
      const result = calculateFare({
        distanceKm: 3.333,
        durationMinutes: 7,
        baseFare: 5,
        pricePerKm: 2.5,
        pricePerMinute: 0.5,
        minimumFare: 10,
        currency: "BRL",
        surgePricing: false,
      });

      expect(result.distanceFare).toBe(8.33); // 3.333 * 2.5 = 8.3325 → 8.33
      expect(result.timeFare).toBe(3.5);
      expect(result.subtotal).toBe(16.83); // 5 + 8.33 + 3.5
      expect(result.total).toBe(16.83);
    });
  });

  describe("serializeFareBreakdown and parseFareBreakdown", () => {
    it("should serialize and deserialize fare breakdown correctly", () => {
      const breakdown = {
        baseFare: 5,
        distanceFare: 25,
        timeFare: 10,
        subtotal: 40,
        multiplier: 1.5,
        total: 60,
        currency: "BRL",
      };

      const serialized = serializeFareBreakdown(breakdown);
      expect(typeof serialized).toBe("string");

      const parsed = parseFareBreakdown(serialized);
      expect(parsed).toEqual(breakdown);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
