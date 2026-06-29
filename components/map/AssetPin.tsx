"use client";

import { Marker } from "react-leaflet";
import type { Asset } from "@/types";
import { categoryColor } from "@/lib/utils";

interface AssetPinProps {
  asset: Asset;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function AssetPin({ asset, isSelected, onSelect }: AssetPinProps) {
  // Prefer live session position, fall back to latest scan
  const pos = asset.liveSession ?? asset.latestScan;
  if (!pos) return null;

  const { latitude, longitude } = pos;
  const color = categoryColor(asset.category);
  const isLive = !!asset.liveSession;

  const initials = asset.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const opacity = asset.status === "inactive" ? 0.4 : 1;
  const isLost = asset.status === "lost";

  const L = typeof window !== "undefined" ? require("leaflet") : null;
  if (!L) return null;

  const selectedRing = isSelected
    ? `box-shadow:0 0 0 3px #fff,0 0 0 5px ${color};`
    : "";

  const pinHtml = `<div class="asset-pin ${isLost ? "asset-pin-lost" : ""}" style="width:36px;height:36px;background:${color};opacity:${opacity}${isLost ? ";border:2px solid #f87171" : ""};${selectedRing}">${initials}</div>`;

  const html = isLive
    ? `<div style="position:relative;width:36px;height:36px;overflow:visible;">
         <span class="asset-pin-live-ring" style="border-color:${color}"></span>
         ${pinHtml}
       </div>`
    : pinHtml;

  const icon = L.divIcon({
    html,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return (
    <Marker
      position={[latitude, longitude]}
      icon={icon}
      eventHandlers={{ click: () => onSelect?.(asset.id) }}
    />
  );
}
