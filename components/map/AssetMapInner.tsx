"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import type { Asset } from "@/types";
import { AssetPin } from "./AssetPin";
import { MapControls } from "./MapControls";

interface AssetMapInnerProps {
  assets: Asset[];
  selectedAssetId?: string | null;
  onAssetSelect?: (id: string) => void;
}

function FlyToSelected({ assets, selectedAssetId }: { assets: Asset[]; selectedAssetId?: string | null }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedAssetId || selectedAssetId === prevId.current) return;
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (asset?.latestScan) {
      map.flyTo([asset.latestScan.latitude, asset.latestScan.longitude], 16, {
        duration: 1.2,
      });
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
  const mappedAssets = assets.filter((a) => a.latestScan);

  const center: [number, number] =
    mappedAssets.length > 0
      ? [mappedAssets[0].latestScan!.latitude, mappedAssets[0].latestScan!.longitude]
      : [-1.2921, 36.8219];

  return (
    <MapContainer
      center={center}
      zoom={mappedAssets.length > 0 ? 13 : 5}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
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
