"use client";

import { useState } from "react";
import { useAssets } from "@/hooks/useAssets";
import { AssetSidebar } from "./AssetSidebar";
import { StatCard } from "./StatCard";
import { StatCardSkeleton } from "./StatCardSkeleton";
import { AssetMap } from "@/components/map/AssetMap";
import { Package, Activity, Clock, BarChart2, ScanLine } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { DashboardStats } from "@/types";

interface DashboardShellProps {
  initialStats: DashboardStats;
}

export function DashboardShell({ initialStats }: DashboardShellProps) {
  const { assets, isLoading } = useAssets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = initialStats;

  return (
    <div className="flex h-full flex-col">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-4 md:grid-cols-4 shrink-0">
        <StatCard
          label="Total Assets"
          value={stats.totalAssets}
          icon={Package}
        />
        <StatCard
          label="Active Today"
          value={stats.activeToday}
          icon={Activity}
        />
        <StatCard
          label="Last Scan"
          value={
            stats.lastScanTime
              ? formatRelativeTime(stats.lastScanTime)
              : "Never"
          }
          icon={Clock}
        />
        <StatCard
          label="Total Scans"
          value={stats.totalScans}
          icon={BarChart2}
        />
      </div>

      {/* Map + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex w-56 shrink-0">
          <AssetSidebar
            assets={assets}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Map */}
        <div className="relative flex-1">
          <AssetMap
            assets={assets}
            selectedAssetId={selectedId}
            onAssetSelect={setSelectedId}
          />
          {/* Mobile FAB */}
          <Button
            asChild
            size="lg"
            className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg md:hidden"
          >
            <Link href="/scan">
              <ScanLine className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
