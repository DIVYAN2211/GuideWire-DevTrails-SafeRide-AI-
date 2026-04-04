/**
 * Pick coordinates: explicit query wins, then saved user profile, else undefined (env default in weather service).
 */
export function resolveWeatherCoords(query, user) {
  const qLat = query.lat != null ? Number(query.lat) : NaN;
  const qLon = query.lon != null ? Number(query.lon) : NaN;
  if (!Number.isNaN(qLat) && !Number.isNaN(qLon)) {
    return { lat: qLat, lon: qLon, source: "query" };
  }
  if (
    user?.latitude != null &&
    user?.longitude != null &&
    !Number.isNaN(Number(user.latitude)) &&
    !Number.isNaN(Number(user.longitude))
  ) {
    return {
      lat: Number(user.latitude),
      lon: Number(user.longitude),
      source: "saved_profile",
    };
  }
  return { lat: undefined, lon: undefined, source: "server_default" };
}

/** Parse lat/lon from verify/signup body */
export function parseClientLocation(body) {
  const lat = body.latitude ?? body.lat;
  const lon = body.longitude ?? body.lon;
  if (lat == null || lon == null) return null;
  const la = Number(lat);
  const lo = Number(lon);
  if (Number.isNaN(la) || Number.isNaN(lo)) return null;
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
  return { lat: la, lon: lo };
}
