/*
 * Small wrapper around the browser Geolocation API.
 *
 * The browser may return a cached, network-derived position when GPS is not
 * available.  Callers should inspect `accuracy` and validate the coordinate
 * against their service area before saving it.
 */

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

export function requestCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: "unsupported",
        message:
          "This browser does not support GPS location. Click the map to choose a point.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords || {};
        if (
          !Number.isFinite(Number(latitude)) ||
          !Number.isFinite(Number(longitude))
        ) {
          reject({
            code: "invalid",
            message:
              "The browser returned an invalid location. Click the map to choose a point.",
          });
          return;
        }
        resolve({
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: Number.isFinite(Number(accuracy)) ? Number(accuracy) : null,
        });
      },
      (error) => {
        reject({
          code: error && error.code,
          message: error && error.message,
        });
      },
      { ...DEFAULT_OPTIONS, ...options }
    );
  });
}

export function describeGeolocationError(error) {
  const code = error && error.code;
  if (code === 1 || code === "denied") {
    return "Location permission was denied. Allow location access for this site in your browser settings, or click the map to set the point manually.";
  }
  if (code === 2 || code === "unavailable") {
    return "Your device could not determine a GPS position. Move to an open area and try again, or click the map to set the point manually.";
  }
  if (code === 3 || code === "timeout") {
    return "Location request timed out. Try again, or click the map to set the point manually.";
  }
  if (code === "unsupported") {
    return "This browser does not support GPS location. Click the map to set the point manually.";
  }
  return "Could not read your GPS location. Click the map to set the point manually.";
}
