import { Store } from '@/lib/types/database';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeStoresCentroid(stores: Store[]): { lat: number; lng: number } | null {
  const withCoords = stores.filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number');
  if (withCoords.length === 0) return null;

  const sum = withCoords.reduce(
    (acc, s) => {
      acc.lat += s.lat as number;
      acc.lng += s.lng as number;
      return acc;
    },
    { lat: 0, lng: 0 }
  );

  return { lat: sum.lat / withCoords.length, lng: sum.lng / withCoords.length };
}

export function filterStoresByRadius(
  stores: Store[],
  radiusKm: number | null | undefined,
  center: { lat: number; lng: number } | null
): Store[] {
  if (!radiusKm || radiusKm <= 0) return stores;
  if (!center) return stores;

  return stores.filter((s) => {
    if (typeof s.lat !== 'number' || typeof s.lng !== 'number') return true;
    return haversineKm(center.lat, center.lng, s.lat, s.lng) <= radiusKm;
  });
}