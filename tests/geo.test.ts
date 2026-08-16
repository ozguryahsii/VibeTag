import { describe, expect, it } from "vitest";
import { coarsen, distanceKm, isValidCoord, FAR_KM } from "@/lib/geo";

/**
 * Location is the only thing here that rests on explicit consent, so the
 * privacy promise made in the KVKK text — "rounded to roughly 100 metres" —
 * is a claim the code has to keep.
 */
describe("coarsening", () => {
  it("keeps a stored position accurate to about 100 metres", () => {
    const lat = 41.008238;
    const lng = 28.978359;

    const drift = distanceKm(lat, lng, coarsen(lat), coarsen(lng));
    expect(drift).toBeLessThan(0.12);
  });

  it("throws away the digits that would identify a building", () => {
    expect(coarsen(41.008238)).toBe(coarsen(41.008291));
    expect(coarsen(28.978359)).toBe(coarsen(28.978402));
  });
});

describe("distance", () => {
  it("is zero for the same point", () => {
    expect(distanceKm(41.0082, 28.9784, 41.0082, 28.9784)).toBe(0);
  });

  it("matches a known city pair", () => {
    // İstanbul → Ankara is about 350 km great-circle.
    const km = distanceKm(41.0082, 28.9784, 39.9334, 32.8597);
    expect(km).toBeGreaterThan(330);
    expect(km).toBeLessThan(370);
    expect(km).toBeLessThan(FAR_KM);
  });

  it("is symmetric", () => {
    const there = distanceKm(41.0082, 28.9784, 38.4237, 27.1428);
    const back = distanceKm(38.4237, 27.1428, 41.0082, 28.9784);
    expect(there).toBeCloseTo(back, 6);
  });
});

describe("coordinate validation", () => {
  it("accepts real positions and rejects impossible ones", () => {
    expect(isValidCoord(41.0082, 28.9784)).toBe(true);
    expect(isValidCoord(0, 0)).toBe(true);
    expect(isValidCoord(91, 0)).toBe(false);
    expect(isValidCoord(0, 181)).toBe(false);
    expect(isValidCoord(Number.NaN, 0)).toBe(false);
  });
});
