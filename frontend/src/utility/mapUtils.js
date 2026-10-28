/**
 * Small guards shared by the map and the model lists.
 *
 * Map data comes from the database, where identifiers may be NULL and a
 * marker may be missing.  Calling `.toLowerCase()` or `map.flyTo()` blindly
 * used to crash the Network Point page (and made the Client tab look empty).
 */

export function matchesSearch(value, searchTerm) {
  return String(value ?? "")
    .toLowerCase()
    .includes(String(searchTerm ?? "").toLowerCase());
}

export const FULL_NETWORK_KEY = "FULL_NETWORK";

/** A layer is visible for its own filter or when the full-network view is on. */
export function isMapLayerActive(categoryFilter, layerKey) {
  return categoryFilter === layerKey || categoryFilter === FULL_NETWORK_KEY;
}

export function validCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function flyToMarker(map, latitude, longitude, zoom = 17) {
  if (!map || typeof map.flyTo !== "function") return;
  if (!validCoordinates(latitude, longitude)) return;
  map.flyTo([Number(latitude), Number(longitude)], zoom);
}

/* The UI calls Zone "Branch" and SubZone "Zone".  In the database the
 * record.zone field holds the branch id and record.subzone the zone id. */
export function matchesBranchZone(record, branchFilter, zoneFilter) {
  if (!record) return false;
  if (branchFilter && String(record.zone) !== String(branchFilter)) return false;
  if (zoneFilter && String(record.subzone) !== String(zoneFilter)) return false;
  return true;
}

export function branchZoneLabel(record, branches, zones) {
  if (!record) return "";
  const branch = (branches || []).find((item) => String(item.id) === String(record.zone));
  const zone = (zones || []).find((item) => String(item.id) === String(record.subzone));
  const parts = [];
  if (branch) parts.push(branch.name);
  if (zone) parts.push(zone.name);
  return parts.join(" / ");
}

export function idOrNull(value) {
  return value === "" || value === null || value === undefined ? null : Number(value);
}
