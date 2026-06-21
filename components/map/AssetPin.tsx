"use client";

import { Marker, Popup } from "react-leaflet";
import type { Asset } from "@/types";
import { categoryColor } from "@/lib/utils";
import { AssetPopup } from "./AssetPopup";

interface AssetPinProps {
  asset: Asset;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function AssetPin({ asset, isSelected, onSelect }: AssetPinProps) {
  if (!asset.latestScan) return null;

  const { latitude, longitude } = asset.latestScan;
  const color = categoryColor(asset.category);
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

  const icon = L.divIcon({
    html: `<div class="asset-pin ${isLost ? "asset-pin-lost" : ""}" style="width:36px;height:36px;background:${color};opacity:${opacity}${isLost ? ";border:2px solid #f87171" : ""}">${initials}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

  return (
    <Marker
      position={[latitude, longitude]}
      icon={icon}
      eventHandlers={{ click: () => onSelect?.(asset.id) }}
    >
      <Popup>
        <AssetPopup asset={asset} />
      </Popup>
    </Marker>
  );
}
