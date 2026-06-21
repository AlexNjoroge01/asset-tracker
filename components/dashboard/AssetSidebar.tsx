"use client";

import { useState } from "react";
import { formatRelativeTime, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search } from "lucide-react";
import type { Asset } from "@/types";

interface AssetSidebarProps {
  assets: Asset[];
  isLoading?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const statusColor: Record<string, string> = {
  active: "bg-green-400",
  inactive: "bg-slate-400",
  lost: "bg-red-400",
};

export function AssetSidebar({ assets, isLoading, selectedId, onSelect }: AssetSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                  <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
              ))
            : filtered.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => onSelect?.(asset.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors",
                    selectedId === asset.id
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "hover:bg-accent/50"
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0",
                      statusColor[asset.status] ?? "bg-slate-400"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {asset.latestScan
                        ? formatRelativeTime(asset.latestScan.scannedAt)
                        : "No scans yet"}
                    </p>
                  </div>
                  {asset.latestScan && (
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
          {!isLoading && filtered.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted-foreground text-center">
              No assets found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
