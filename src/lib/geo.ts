/**
 * Coarse location for the "people near me" list.
 *
 * Coordinates are rounded before they are stored — enough to sort a list by
 * distance, not enough to point at someone's home. Distances are shown in
 * bands for the same reason: "3 km away", never "412 m".
 */

/** ~100 m of precision. */
export function coarsen(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

const EARTH_KM = 6371;

/** Great-circle distance in kilometres. */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** Beyond this we simply say "far away" rather than a misleading number. */
export const FAR_KM = 500;
