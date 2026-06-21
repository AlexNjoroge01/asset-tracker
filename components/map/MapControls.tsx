"use client";

import { useMap } from "react-leaflet";
import type L from "leaflet";
import type { Asset } from "@/types";
import { Maximize2 } from "lucide-react";

interface MapControlsProps {
  assets: Asset[];
}

export function MapControls({ assets }: MapControlsProps) {
  const map = useMap();

  function fitAll() {
    const withScans = assets.filter((a) => a.latestScan);
    if (withScans.length === 0) return;
    const L = require("leaflet");
    const bounds = L.latLngBounds(
      withScans.map((a) => [a.latestScan!.latitude, a.latestScan!.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }

  return (
    <div
      className="leaflet-top leaflet-right"
      style={{ marginTop: "10px", marginRight: "10px" }}
    >
      <div className="leaflet-bar leaflet-control">
        <button
          onClick={fitAll}
          title="Fit all assets"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            background: "#1e293b",
            border: "none",
            cursor: "pointer",
            color: "#94a3b8",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f1f5f9")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
}
