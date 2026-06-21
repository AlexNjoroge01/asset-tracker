"use client";

import { useState } from "react";

type PermissionState = "idle" | "requesting" | "granted" | "denied" | "error";

export function useGeolocation() {
  const [permissionState, setPermissionState] = useState<PermissionState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function getPosition(): Promise<GeolocationCoordinates> {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser.");
    }

    setPermissionState("requesting");

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermissionState("granted");
          setError(null);
          resolve(position.coords);
        },
        (err) => {
          const msg =
            err.code === err.PERMISSION_DENIED
              ? "Location access required. Enable it in browser settings."
              : "Unable to retrieve location. Please try again.";
          setPermissionState(err.code === err.PERMISSION_DENIED ? "denied" : "error");
          setError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  return { permissionState, error, getPosition };
}
