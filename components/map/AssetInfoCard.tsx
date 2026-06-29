import Link from "next/link";
import { X, MapPin, Clock, Target, Tag, Info, ExternalLink } from "lucide-react";
import type { Asset } from "@/types";
import { formatCoords, formatRelativeTime, getAccuracyLevel, categoryColor } from "@/lib/utils";

interface AssetInfoCardProps {
  asset: Asset;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
  active:   { label: "Active",   dot: "bg-green-400", text: "text-green-400" },
  inactive: { label: "Inactive", dot: "bg-slate-400", text: "text-slate-400" },
  lost:     { label: "Lost",     dot: "bg-red-400",   text: "text-red-400"   },
};

const accuracyConfig: Record<string, { label: string; color: string }> = {
  high:   { label: "High",   color: "text-green-400"  },
  medium: { label: "Medium", color: "text-yellow-400" },
  low:    { label: "Low",    color: "text-red-400"    },
};

export function AssetInfoCard({ asset, onClose }: AssetInfoCardProps) {
  const scan = asset.latestScan;
  const s = statusConfig[asset.status] ?? statusConfig.inactive;
  const color = categoryColor(asset.category);
  const accuracy = scan ? getAccuracyLevel(scan.accuracy) : null;
  const initials = asset.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="absolute bottom-4 left-4 z-[1000] w-72 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex items-start gap-2.5 p-3">
        <div
          className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs"
          style={{ background: color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {asset.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
            <span className={`text-[10px] font-medium ${s.text}`}>{s.label}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-accent transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="mx-3 border-t border-border/50" />

      {/* Details */}
      <div className="p-3 space-y-2.5">
        {/* Category */}
        <Row icon={<Tag className="h-3 w-3" />} label="Category">
          <span
            className="text-[10px] font-semibold text-white capitalize px-2 py-0.5 rounded-full"
            style={{ background: color }}
          >
            {asset.category}
          </span>
        </Row>

        {/* Description */}
        {asset.description && (
          <div className="flex items-start gap-1.5 text-xs bg-muted/30 rounded-md px-2.5 py-2">
            <Info className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-foreground/80 leading-relaxed line-clamp-2">{asset.description}</p>
          </div>
        )}

        {scan ? (
          <>
            <Row icon={<Clock className="h-3 w-3" />} label="Last scan">
              {formatRelativeTime(scan.scannedAt)}
            </Row>
            <Row icon={<MapPin className="h-3 w-3" />} label="Coordinates">
              <span className="font-mono text-[10px]">
                {formatCoords(scan.latitude, scan.longitude)}
              </span>
            </Row>
            {accuracy && (
              <Row icon={<Target className="h-3 w-3" />} label="GPS accuracy">
                <span className={`${accuracyConfig[accuracy].color} font-medium`}>
                  {scan.accuracy != null ? `±${Math.round(scan.accuracy)}m` : "—"}
                  <span className="text-muted-foreground font-normal ml-1">
                    ({accuracyConfig[accuracy].label})
                  </span>
                </span>
              </Row>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-1">
            No location data available
          </p>
        )}
      </div>

      <div className="mx-3 border-t border-border/50" />

      {/* Footer */}
      <div className="p-3">
        <Link
          href={`/assets/${asset.id}`}
          className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium py-2 transition-colors"
        >
          View Full Details
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        {icon}
        {label}
      </span>
      <span className="text-foreground text-right">{children}</span>
    </div>
  );
}
