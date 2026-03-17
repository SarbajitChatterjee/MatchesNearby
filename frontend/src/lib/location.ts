/**
 * Cross-platform location helper.
 *
 * On native (Capacitor) platforms, this uses the Geolocation plugin
 * so that Android/iOS permission flows are handled correctly.
 * On the web, it falls back to the standard `navigator.geolocation`.
 *
 * The goal is to have a single, well-documented place where the
 * permission and error-handling behaviour lives, rather than sprinkling
 * raw geolocation calls across multiple screens.
 */
import { Capacitor } from "@capacitor/core";
import { Geolocation, PermissionStatus } from "@capacitor/geolocation";

type LocationErrorCode =
  | "location_permission_denied"
  | "location_unavailable"
  | "location_timeout";

export class LocationError extends Error {
  code: LocationErrorCode;

  constructor(code: LocationErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function hasGrantedPermission(status: PermissionStatus): boolean {
  return (
    status.location === "granted" ||
    status.coarseLocation === "granted" ||
    status.locationWhenInUse === "granted"
  );
}

/**
 * getCurrentPosition — resolve the user's current position or throw a
 * typed LocationError when permissions are denied or the position
 * cannot be determined.
 */
export async function getCurrentPosition(
  options?: PositionOptions
): Promise<GeolocationPosition> {
  const isNative = Capacitor.isNativePlatform?.() ?? Capacitor.getPlatform() !== "web";

  if (isNative) {
    // Capacitor Geolocation path — explicit permission flow.
    let status = await Geolocation.checkPermissions();
    if (!hasGrantedPermission(status)) {
      status = await Geolocation.requestPermissions();
      if (!hasGrantedPermission(status)) {
        throw new LocationError(
          "location_permission_denied",
          "Location permission was denied."
        );
      }
    }

    try {
      const pos = await Geolocation.getCurrentPosition({
        timeout: options?.timeout,
        enableHighAccuracy: options?.enableHighAccuracy,
        maximumAge: options?.maximumAge,
      });
      // GeolocationPosition exists in the DOM lib; the plugin's return type
      // is structurally compatible.
      return pos as unknown as GeolocationPosition;
    } catch (err: any) {
      if (err?.code === 3) {
        // POSITION_UNAVAILABLE / TIMEOUT from some platforms.
        throw new LocationError(
          "location_timeout",
          "Timed out while trying to determine your location."
        );
      }
      throw new LocationError(
        "location_unavailable",
        "Unable to determine your location."
      );
    }
  }

  // Browser fallback.
  if (!navigator.geolocation) {
    throw new LocationError(
      "location_unavailable",
      "This device does not support location services in the browser."
    );
  }

  return await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new LocationError(
              "location_permission_denied",
              "Location permission was denied."
            )
          );
        } else if (err.code === err.TIMEOUT) {
          reject(
            new LocationError(
              "location_timeout",
              "Timed out while trying to determine your location."
            )
          );
        } else {
          reject(
            new LocationError(
              "location_unavailable",
              "Unable to determine your location."
            )
          );
        }
      },
      options
    );
  });
}

