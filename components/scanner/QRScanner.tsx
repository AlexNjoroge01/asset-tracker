"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { ScanResult } from "./ScanResult";
import type { Asset, Scan } from "@/types";

type ScannerState = "idle" | "scanning" | "success" | "error";

export function QRScanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [state, setState] = useState<ScannerState>("idle");
  const [permDenied, setPermDenied] = useState(false);
  const [scanData, setScanData] = useState<{ asset: Asset; scan: Scan } | null>(null);

  function startScanner() {
    if (!containerRef.current) return;
    setState("scanning");

    const { Html5QrcodeScanner } = require("html5-qrcode");

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanError);
  }

  async function onScanSuccess(decodedText: string) {
    try {
      await scannerRef.current?.clear();
    } catch {}

    setState("idle");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const res = await fetch("/api/scans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              qr_code: decodedText,
              latitude,
              longitude,
              accuracy,
            }),
          });

          if (res.status === 404) {
            toast.warning("QR code not recognised. Check the asset register.");
            setState("scanning");
            startScanner();
            return;
          }

          if (!res.ok) {
            toast.error("Something went wrong. Please try again.");
            setState("error");
            return;
          }

          const data = await res.json();

          if (accuracy > 100) {
            toast.warning(
              `Location captured but accuracy is low (±${Math.round(accuracy)}m).`
            );
          } else {
            toast.success(`Scan recorded — ${data.asset.name}`);
          }

          setScanData({
            asset: data.asset,
            scan: {
              ...data.scan,
              latitude,
              longitude,
              accuracy,
            },
          });
          setState("success");
        } catch {
          toast.error("Something went wrong. Please try again.");
          setState("error");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermDenied(true);
          toast.error(
            "Location access required. Enable it in browser settings."
          );
        } else {
          toast.error("Unable to retrieve location. Please try again.");
        }
        setState("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function onScanError() {
    // ignore continuous decode failures
  }

  function reset() {
    setScanData(null);
    setPermDenied(false);
    setState("idle");
    startScanner();
  }

  useEffect(() => {
    startScanner();
    return () => {
      try {
        scannerRef.current?.clear();
      } catch {}
    };
  }, []);

  if (permDenied) {
    return (
      <Alert variant="destructive" className="mx-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Camera or location access was denied. Please enable permissions in your
          browser settings and reload this page.
        </AlertDescription>
      </Alert>
    );
  }

  if (state === "success" && scanData) {
    return (
      <div className="px-4">
        <ScanResult
          asset={scanData.asset}
          scan={scanData.scan}
          onScanAgain={reset}
        />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-4 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An error occurred. Please try scanning again.
          </AlertDescription>
        </Alert>
        <Button onClick={reset} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {state === "scanning" && (
        <p className="text-center text-sm text-muted-foreground">
          Point your camera at an asset QR code
        </p>
      )}
      <div
        id="qr-reader"
        ref={containerRef}
        className="rounded-xl overflow-hidden"
      />
    </div>
  );
}
