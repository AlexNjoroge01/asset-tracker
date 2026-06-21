"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download, Printer, Smartphone, Tablet, Monitor,
  MapPin, Clock, QrCode, Activity,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { parseDeviceInfo } from "@/lib/device";
import { formatRelativeTime, formatCoords } from "@/lib/utils";
import type { Asset } from "@/types";

/* ── types ─────────────────────────────── */
interface ScanRow {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory: string;
  scannedAt: string;
  latitude: string;
  longitude: string;
  accuracy: string | null;
  deviceInfo: string | null;
  scannerName: string | null;
}

interface Props {
  assets: Asset[];
  recentScans: ScanRow[];
}

/* ── category badge colours ─────────────── */
const catBadge: Record<string, string> = {
  laptop: "bg-sky-500/15 text-sky-400",
  phone:  "bg-green-500/15 text-green-400",
  router: "bg-orange-500/15 text-orange-400",
  tablet: "bg-purple-500/15 text-purple-400",
  other:  "bg-slate-500/15 text-slate-400",
};

/* ── QR Card ────────────────────────────── */
function QRCard({ asset, scanCount }: { asset: Asset; scanCount: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(`/api/assets/${asset.id}/qr`);
  }, [asset.id]);

  function handlePrint() {
    if (!src) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR — ${asset.name}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;padding:48px;font-family:sans-serif;">
        <h2 style="margin-bottom:12px">${asset.name}</h2>
        <img src="${src}" width="280" height="280"/>
        <p style="font-size:11px;color:#666;margin-top:12px;">Scan to track this asset</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <Card className="border-border">
      <CardContent className="p-4 flex flex-col items-center gap-3">
        {/* QR image */}
        <div className="flex h-[160px] w-[160px] items-center justify-center rounded-xl bg-white p-2 shadow-inner">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`QR for ${asset.name}`} width={148} height={148} className="rounded-lg" />
          ) : (
            <Skeleton className="h-[148px] w-[148px] rounded-lg" />
          )}
        </div>

        {/* Name + badge */}
        <div className="text-center space-y-1 w-full">
          <Link
            href={`/assets/${asset.id}`}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {asset.name}
          </Link>
          <div className="flex items-center justify-center gap-1.5">
            <Badge className={catBadge[asset.category] ?? catBadge.other} variant="outline">
              {asset.category}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground border-border text-xs">
              {scanCount} scan{scanCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        <Separator className="opacity-40" />

        {/* Actions */}
        <div className="flex gap-2 w-full">
          {src && (
            <Button asChild variant="default" size="sm" className="flex-1 text-xs h-8">
              <a href={src} download={`qr-${asset.name.replace(/\s+/g, "-")}.png`}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Device icon helper ─────────────────── */
function DeviceIcon({ type }: { type: "mobile" | "tablet" | "desktop" }) {
  if (type === "mobile")  return <Smartphone className="h-4 w-4 shrink-0" />;
  if (type === "tablet")  return <Tablet     className="h-4 w-4 shrink-0" />;
  return                          <Monitor    className="h-4 w-4 shrink-0" />;
}

/* ── Main page component ────────────────── */
export function ScanPageClient({ assets, recentScans }: Props) {
  // Build scan count per asset
  const scanCounts: Record<string, number> = {};
  for (const s of recentScans) {
    scanCounts[s.assetId] = (scanCounts[s.assetId] ?? 0) + 1;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">QR Codes & Scan Activity</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Download or print QR codes, and review which devices have scanned them.
        </p>
      </div>

      <Tabs defaultValue="qr">
        <TabsList>
          <TabsTrigger value="qr" className="gap-2">
            <QrCode className="h-4 w-4" />
            QR Codes
            <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0">{assets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Scan Activity
            <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0">{recentScans.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── QR Codes tab ── */}
        <TabsContent value="qr" className="mt-4">
          {assets.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                No active assets yet.{" "}
                <Link href="/assets/new" className="text-primary hover:underline">
                  Create one
                </Link>{" "}
                to generate a QR code.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {assets.map((asset) => (
                <QRCard key={asset.id} asset={asset} scanCount={scanCounts[asset.id] ?? 0} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Activity tab ── */}
        <TabsContent value="activity" className="mt-4">
          {recentScans.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                No scans recorded yet. Scan a QR code with your phone to see activity here.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {recentScans.map((scan) => {
                const device = parseDeviceInfo(scan.deviceInfo);
                const lat = parseFloat(scan.latitude);
                const lng = parseFloat(scan.longitude);
                const acc = scan.accuracy ? parseFloat(scan.accuracy) : null;

                return (
                  <Card key={scan.id} className="border-border">
                    <CardContent className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {/* Device icon circle */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                          {device ? <DeviceIcon type={device.type} /> : <Smartphone className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Top row: device + time */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {device ? (
                                <>
                                  <span className="font-medium text-sm text-foreground">
                                    {device.device}
                                  </span>
                                  <span className="text-muted-foreground text-xs">·</span>
                                  <span className="text-xs text-muted-foreground">{device.os}</span>
                                  <span className="text-muted-foreground text-xs">·</span>
                                  <span className="text-xs text-muted-foreground">{device.browser}</span>
                                </>
                              ) : (
                                <span className="font-medium text-sm text-foreground">Unknown device</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(new Date(scan.scannedAt))}
                            </div>
                          </div>

                          {/* Bottom row: asset + location */}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <Link
                              href={`/assets/${scan.assetId}`}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <QrCode className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{scan.assetName}</span>
                              <Badge
                                className={`${catBadge[scan.assetCategory] ?? catBadge.other} text-[10px] px-1.5 py-0`}
                                variant="outline"
                              >
                                {scan.assetCategory}
                              </Badge>
                            </Link>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="font-mono">{formatCoords(lat, lng)}</span>
                              {acc && (
                                <span className="text-muted-foreground/60">±{Math.round(acc)}m</span>
                              )}
                            </div>

                            {device?.screenWidth ? (
                              <span className="text-xs text-muted-foreground/60 font-mono">
                                {device.screenWidth}×{device.screenHeight}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
