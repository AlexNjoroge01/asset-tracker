"use client";

import { useState } from "react";
import { useAssets } from "@/hooks/useAssets";
import { AssetSidebar } from "./AssetSidebar";
import { StatCard } from "./StatCard";
import { AssetMap } from "@/components/map/AssetMap";
import { AssetInfoCard } from "@/components/map/AssetInfoCard";
import { Package, Activity, Clock, BarChart2, ScanLine, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const stats = initialStats;
  const selectedAsset = selectedId ? (assets.find((a) => a.id === selectedId) ?? null) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-4 md:grid-cols-4 shrink-0">
        <StatCard label="Total Assets" value={stats.totalAssets} icon={Package} />
        <StatCard label="Active Today" value={stats.activeToday} icon={Activity} />
        <StatCard
          label="Last Scan"
          value={stats.lastScanTime ? formatRelativeTime(stats.lastScanTime) : "Never"}
          icon={Clock}
        />
        <StatCard label="Total Scans" value={stats.totalScans} icon={BarChart2} />
      </div>

      {/* Map + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile, collapsible on desktop */}
        <div
          className={`hidden md:flex shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            sidebarOpen ? "w-56" : "w-0"
          }`}
        >
          <AssetSidebar
            assets={assets}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Map */}
        <div className="relative flex-1">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden md:flex absolute left-2 top-2 z-[1000] h-8 w-8 items-center justify-center rounded-md bg-card/90 backdrop-blur border border-border shadow-sm hover:bg-accent transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <AssetMap
            assets={assets}
            selectedAssetId={selectedId}
            onAssetSelect={setSelectedId}
          />

          {/* Asset info card */}
          {selectedAsset && (
            <AssetInfoCard
              asset={selectedAsset}
              onClose={() => setSelectedId(null)}
            />
          )}

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
