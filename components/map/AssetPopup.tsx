import Link from "next/link";
import type { Asset } from "@/types";
import { formatCoords, formatRelativeTime } from "@/lib/utils";

interface AssetPopupProps {
  asset: Asset;
}

const statusDot: Record<string, string> = {
  active: "#4ade80",
  inactive: "#94a3b8",
  lost: "#f87171",
};

export function AssetPopup({ asset }: AssetPopupProps) {
  const dot = statusDot[asset.status] ?? "#94a3b8";
  const scan = asset.latestScan;

  return (
    <div className="w-64 p-3 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ background: dot }}
        />
        <span className="font-semibold text-slate-100 truncate">{asset.name}</span>
      </div>
      <div className="border-t border-slate-700 my-2" />
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Category</span>
          <span className="text-slate-200 capitalize">{asset.category}</span>
        </div>
        {scan && (
          <>
            <div className="flex justify-between">
              <span className="text-slate-400">Last scan</span>
              <span className="text-slate-200">{formatRelativeTime(scan.scannedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Coordinates</span>
              <span className="text-slate-200 font-mono text-[10px]">
                {formatCoords(scan.latitude, scan.longitude)}
              </span>
            </div>
            {scan.accuracy && (
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy</span>
                <span className="text-slate-200">±{Math.round(scan.accuracy)}m</span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-3">
        <Link
          href={`/assets/${asset.id}`}
          className="text-sky-400 hover:text-sky-300 text-xs font-medium"
        >
          View Full History →
        </Link>
      </div>
    </div>
  );
}
