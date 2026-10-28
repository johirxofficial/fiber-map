/*
 * Map and GPS defaults.
 *
 * Deployments outside the default service area can override these at
 * build time with:
 *   REACT_APP_MAP_CENTER_LAT=...
 *   REACT_APP_MAP_CENTER_LNG=...
 *   REACT_APP_MAP_ZOOM=...
 *   REACT_APP_MAX_GPS_DISTANCE_KM=...
 *
 * Setting REACT_APP_MAX_GPS_DISTANCE_KM=0 disables the distance guard.  The
 * guard exists because desktop browsers sometimes return an approximate IP/Wi-Fi
 * location from another country instead of a real GPS fix.
 */

function envNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const DEFAULT_MAP_CENTER = {
  lat: envNumber("REACT_APP_MAP_CENTER_LAT", 23.8103),
  lng: envNumber("REACT_APP_MAP_CENTER_LNG", 90.4125),
};

export const DEFAULT_MAP_ZOOM = envNumber("REACT_APP_MAP_ZOOM", 13);

/* 500 km comfortably covers Bangladesh while rejecting cross-continent
   browser/network fixes (for example a reported location in Europe). */
export const MAX_GPS_DISTANCE_KM = envNumber(
  "REACT_APP_MAX_GPS_DISTANCE_KM",
  500
);

export const GOOGLE_TILE_SUBDOMAINS = ["mt0", "mt1", "mt2", "mt3"];

export const GOOGLE_STREET_URL =
  "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
export const GOOGLE_HYBRID_URL =
  "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}";

export function distanceKm(lat1, lng1, lat2, lng2) {
  const values = [lat1, lng1, lat2, lng2].map(Number);
  if (!values.every(Number.isFinite)) return Infinity;
  const [aLat, aLng, bLat, bLng] = values;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinConfiguredArea(latitude, longitude) {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return false;
  }
  if (MAX_GPS_DISTANCE_KM <= 0) return true;
  return (
    distanceKm(
      Number(latitude),
      Number(longitude),
      DEFAULT_MAP_CENTER.lat,
      DEFAULT_MAP_CENTER.lng
    ) <= MAX_GPS_DISTANCE_KM
  );
}
