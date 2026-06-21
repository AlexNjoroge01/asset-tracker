"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCoords, formatRelativeTime, getAccuracyLevel } from "@/lib/utils";
import type { Asset, Scan } from "@/types";

interface ScanResultProps {
  asset: Asset;
  scan: Scan;
  onScanAgain: () => void;
}

const categoryVariant: Record<string, string> = {
  laptop: "bg-sky-500/15 text-sky-400",
  phone: "bg-green-500/15 text-green-400",
  router: "bg-orange-500/15 text-orange-400",
  tablet: "bg-purple-500/15 text-purple-400",
  other: "bg-slate-500/15 text-slate-400",
};

const accuracyVariant: Record<string, string> = {
  high: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function ScanResult({ asset, scan, onScanAgain }: ScanResultProps) {
  const accuracyLevel = getAccuracyLevel(scan.accuracy);

  return (
    <Card className="border-border animate-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{asset.name}</CardTitle>
          <Badge className={categoryVariant[asset.category]} variant="outline">
            {asset.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Scan time</span>
            <span>{formatRelativeTime(scan.scannedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coordinates</span>
            <span className="font-mono text-xs">
              {formatCoords(scan.latitude, scan.longitude)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">GPS accuracy</span>
            <Badge className={accuracyVariant[accuracyLevel]} variant="outline">
              {accuracyLevel === "high"
                ? "High"
                : accuracyLevel === "medium"
                ? "Medium"
                : "Low"}{" "}
              {scan.accuracy ? `(±${Math.round(scan.accuracy)}m)` : ""}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={onScanAgain}>
            Scan Another
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link href={`/assets/${asset.id}`}>View Asset</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
