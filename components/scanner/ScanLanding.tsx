"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, Radio, StopCircle, XCircle, AlertTriangle,
  Smartphone, Monitor, Tablet, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCoords, getAccuracyLevel } from "@/lib/utils";
import { collectDeviceInfo, type DeviceInfo } from "@/lib/device";
import type { Asset } from "@/types";

type State = "locating" | "starting" | "tracking" | "stopped" | "gps-error" | "not-found" | "api-error";

interface LivePos {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

const SEND_INTERVAL_MS = 5000;

const categoryBadge: Record<string, string> = {
  laptop: "bg-sky-500/15 text-sky-400",
  phone: "bg-green-500/15 text-green-400",
  router: "bg-orange-500/15 text-orange-400",
  tablet: "bg-purple-500/15 text-purple-400",
  other: "bg-slate-500/15 text-slate-400",
};

function DeviceIcon({ type }: { type: DeviceInfo["type"] }) {
  if (type === "mobile") return <Smartphone className="h-4 w-4" />;
  if (type === "tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

export function ScanLanding({ qrCode }: { qrCode: string }) {
  const [state, setState] = useState<State>("locating");
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [pos, setPos] = useState<LivePos | null>(null);

  const sessionTokenRef = useRef<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  const sendPosition = useCallback((lat: number, lng: number, acc: number | null) => {
    const token = sessionTokenRef.current;
    if (!token) return;
    const now = Date.now();
    if (now - lastSentRef.current < SEND_INTERVAL_MS) return;
    lastSentRef.current = now;
    fetch(`/api/track/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lng, accuracy: acc ?? undefined }),
    }).catch(() => {});
  }, []);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const token = sessionTokenRef.current;
    if (token) {
      sessionTokenRef.current = null;
      await fetch(`/api/track/${token}`, { method: "DELETE" }).catch(() => {});
    }
    setState("stopped");
  }, []);

  // Cleanup on page unload
  useEffect(() => {
    const handleUnload = () => {
      const token = sessionTokenRef.current;
      if (token) {
        fetch(`/api/track/${token}`, { method: "DELETE", keepalive: true }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Start live tracking flow
  useEffect(() => {
    if (!navigator.geolocation) {
      setState("gps-error");
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const deviceInfo = collectDeviceInfo();
    setDevice(deviceInfo);

    // Get initial position, then start session
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setPos({ latitude, longitude, accuracy });
        setState("starting");

        try {
          const res = await fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              qr_code: qrCode,
              latitude,
              longitude,
              accuracy,
              deviceInfo: JSON.stringify(deviceInfo),
            }),
          });

          if (res.status === 404) { setState("not-found"); return; }
          if (!res.ok) {
            setState("api-error");
            setError("Failed to start tracking. Please try again.");
            return;
          }

          const data = await res.json();
          sessionTokenRef.current = data.sessionToken;
          lastSentRef.current = Date.now();
          setAsset(data.asset);
          setState("tracking");

          // Begin continuous tracking
          watchIdRef.current = navigator.geolocation.watchPosition(
            (updated) => {
              const { latitude: lat, longitude: lng, accuracy: acc } = updated.coords;
              setPos({ latitude: lat, longitude: lng, accuracy: acc });
              sendPosition(lat, lng, acc);
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
          );
        } catch {
          setState("api-error");
          setError("Network error. Please check your connection.");
        }
      },
      (err) => {
        setState("gps-error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Enable location in your browser settings and reload."
            : "Could not get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [qrCode, sendPosition]);

  /* ── Locating / Starting ── */
  if (state === "locating" || state === "starting") {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-10">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <MapPin className="h-7 w-7 text-primary" />
          <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {state === "locating" ? "Getting your location…" : "Starting tracking session…"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {state === "locating"
              ? "Allow location access when your browser asks"
              : "Almost ready, hold on"}
          </p>
        </div>
      </div>
    );
  }

  /* ── Tracking ── */
  if (state === "tracking" && asset && pos) {
    const accuracyLevel = getAccuracyLevel(pos.accuracy);
    const accuracyColor =
      accuracyLevel === "high" ? "text-green-400" :
      accuracyLevel === "medium" ? "text-yellow-400" : "text-red-400";

    return (
      <div className="flex flex-col gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
            <Radio className="h-5 w-5 text-green-400" />
            <span className="absolute inset-0 rounded-full border-2 border-green-400/40 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">Live tracking active</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Location is being sent to the dashboard</p>
          </div>
        </div>

        {/* Asset card */}
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base truncate">{asset.name}</CardTitle>
              <Badge className={categoryBadge[asset.category] ?? "bg-slate-500/15 text-slate-400"} variant="outline">
                {asset.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2 text-sm">
            <Separator />

            {/* Live coordinates */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Navigation className="h-3 w-3" />
                Current Location
              </p>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Coordinates</span>
                <span className="font-mono text-xs">{formatCoords(pos.latitude, pos.longitude)}</span>
              </div>
              {pos.accuracy != null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">GPS accuracy</span>
                  <span className={`text-xs font-medium ${accuracyColor}`}>
                    ±{Math.round(pos.accuracy)}m ({accuracyLevel})
                  </span>
                </div>
              )}
            </div>

            {device && (
              <>
                <Separator />
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <DeviceIcon type={device.type} />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      This device
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Device</span>
                    <span className="text-xs">{device.device}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">OS</span>
                    <span className="text-xs">{device.os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Browser</span>
                    <span className="text-xs">{device.browser}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={stopTracking}
        >
          <StopCircle className="h-4 w-4" />
          Stop Tracking
        </Button>
      </div>
    );
  }

  /* ── Stopped ── */
  if (state === "stopped") {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/40">
          <StopCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Tracking stopped</p>
          <p className="text-sm text-muted-foreground mt-1">
            This device is no longer sending its location.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Start again
        </Button>
      </div>
    );
  }

  /* ── GPS error ── */
  if (state === "gps-error") {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/20">
          <AlertTriangle className="h-7 w-7 text-yellow-400" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Location required</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  /* ── Not found ── */
  if (state === "not-found") {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="font-semibold text-foreground">QR code not recognised</p>
          <p className="text-sm text-muted-foreground mt-1">
            This asset may have been removed from the system.
          </p>
        </div>
      </div>
    );
  }

  /* ── API error ── */
  return (
    <div className="flex flex-col items-center gap-4 text-center py-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
        <XCircle className="h-7 w-7 text-destructive" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Could not start tracking</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}
