"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin, CheckCircle, XCircle, Loader2, AlertTriangle,
  Smartphone, Monitor, Tablet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCoords, getAccuracyLevel } from "@/lib/utils";
import { collectDeviceInfo, type DeviceInfo } from "@/lib/device";
import type { Asset, Scan } from "@/types";

type State = "locating" | "success" | "gps-error" | "not-found" | "api-error";

const accuracyBadge: Record<string, string> = {
  high: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-red-500/15 text-red-400 border-red-500/30",
};

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

interface ScanLandingProps {
  qrCode: string;
}

export function ScanLanding({ qrCode }: ScanLandingProps) {
  const [state, setState] = useState<State>("locating");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    asset: Asset;
    scan: Scan;
    device: DeviceInfo;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState("gps-error");
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const device = collectDeviceInfo();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const res = await fetch("/api/scans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              qr_code: qrCode,
              latitude,
              longitude,
              accuracy,
              deviceInfo: JSON.stringify(device),
            }),
          });

          if (res.status === 404) { setState("not-found"); return; }
          if (!res.ok) {
            setState("api-error");
            setError("Something went wrong recording the scan.");
            return;
          }

          const data = await res.json();
          setResult({
            asset: data.asset,
            scan: { ...data.scan, latitude, longitude, accuracy },
            device,
          });
          setState("success");
        } catch {
          setState("api-error");
          setError("Network error. Please try again.");
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
  }, [qrCode]);

  /* ── Locating ── */
  if (state === "locating") {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-10">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <MapPin className="h-7 w-7 text-primary" />
          <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Getting your location…</p>
          <p className="text-sm text-muted-foreground mt-1">
            Allow location access when your browser asks
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Waiting for GPS signal
        </div>
      </div>
    );
  }

  /* ── Success ── */
  if (state === "success" && result) {
    const accuracyLevel = getAccuracyLevel(result.scan.accuracy);

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Location recorded</p>
            <p className="text-xs text-muted-foreground">
              This device has been logged on the map
            </p>
          </div>
        </div>

        {/* Asset */}
        <Card className="border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base truncate">{result.asset.name}</CardTitle>
              <Badge className={categoryBadge[result.asset.category]} variant="outline">
                {result.asset.category}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2 text-sm">
            <Separator />

            {/* Location */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Location
              </p>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Coordinates</span>
                <span className="font-mono text-xs">
                  {formatCoords(result.scan.latitude, result.scan.longitude)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">GPS accuracy</span>
                <Badge className={accuracyBadge[accuracyLevel]} variant="outline">
                  {accuracyLevel === "high" ? "High" : accuracyLevel === "medium" ? "Medium" : "Low"}
                  {result.scan.accuracy ? ` ±${Math.round(result.scan.accuracy)}m` : ""}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Device */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <DeviceIcon type={result.device.type} />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  This device
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Device</span>
                <span className="text-xs">{result.device.device}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">OS</span>
                <span className="text-xs">{result.device.os}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Browser</span>
                <span className="text-xs">{result.device.browser}</span>
              </div>
              {result.device.screenWidth > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Screen</span>
                  <span className="text-xs font-mono">
                    {result.device.screenWidth}×{result.device.screenHeight}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button asChild className="w-full">
          <Link href={`/assets/${result.asset.id}`}>View asset history →</Link>
        </Button>
      </div>
    );
  }

  /* ── GPS denied / error ── */
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
        <p className="font-semibold text-foreground">Could not record scan</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  );
}
