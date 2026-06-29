"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import type { Asset } from "@/types";
import { AssetPin } from "./AssetPin";
import { MapControls } from "./MapControls";

const TILES = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
};

function useDarkMode() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

interface AssetMapInnerProps {
  assets: Asset[];
  selectedAssetId?: string | null;
  onAssetSelect?: (id: string) => void;
}

function FlyToSelected({
  assets,
  selectedAssetId,
}: {
  assets: Asset[];
  selectedAssetId?: string | null;
}) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedAssetId || selectedAssetId === prevId.current) return;
    const asset = assets.find((a) => a.id === selectedAssetId);
    const pos = asset?.liveSession ?? asset?.latestScan;
    if (pos) {
      map.flyTo([pos.latitude, pos.longitude], 16, { duration: 1.2 });
      prevId.current = selectedAssetId;
    }
  }, [selectedAssetId, assets, map]);

  return null;
}

export default function AssetMapInner({
  assets,
  selectedAssetId,
  onAssetSelect,
}: AssetMapInnerProps) {
  const isDark = useDarkMode();
  const mappedAssets = assets.filter((a) => a.latestScan || a.liveSession);

  const firstPos = mappedAssets.length > 0
    ? (mappedAssets[0].liveSession ?? mappedAssets[0].latestScan)
    : null;

  const center: [number, number] = firstPos
    ? [firstPos.latitude, firstPos.longitude]
    : [-1.2921, 36.8219];

  const tiles = isDark ? TILES.dark : TILES.light;

  return (
    <MapContainer
      center={center}
      zoom={mappedAssets.length > 0 ? 13 : 5}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        key={isDark ? "dark" : "light"}
        url={tiles.url}
        attribution={tiles.attribution}
        subdomains="abcd"
        maxZoom={19}
      />
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={(cluster) => {
          const L = require("leaflet");
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="marker-cluster-custom" style="width:36px;height:36px;">${count}</div>`,
            className: "",
            iconSize: [36, 36],
          });
        }}
      >
        {mappedAssets.map((asset) => (
          <AssetPin
            key={asset.id}
            asset={asset}
            isSelected={asset.id === selectedAssetId}
            onSelect={onAssetSelect}
          />
        ))}
      </MarkerClusterGroup>
      <MapControls assets={mappedAssets} />
      <FlyToSelected assets={assets} selectedAssetId={selectedAssetId} />
    </MapContainer>
  );
}
