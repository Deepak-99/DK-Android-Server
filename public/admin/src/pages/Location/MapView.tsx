import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import HeatMapLayer from "./HeatMapLayer";
import "leaflet/dist/leaflet.css";

interface LocationPoint {
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  points: LocationPoint[];
  live?: LocationPoint | null;
}

export default function MapView({ points, live }: MapViewProps) {

  const [mode, setMode] = useState<"path" | "heat">("path");

  const path: LatLngExpression[] = useMemo(
    () => points.map(p => [p.latitude, p.longitude]),
    [points]
  );

  const center: LatLngExpression =
    live
      ? [live.latitude, live.longitude]
      : path[0] ?? [0, 0];

  return (
    <div className="h-full w-full relative">

      {/* Toggle Button */}
      <div className="absolute z-[1000] top-2 right-2 bg-white p-2 rounded shadow">
        <button
          className="text-sm"
          onClick={() =>
            setMode(prev => (prev === "path" ? "heat" : "path"))
          }
        >
          {mode === "path" ? "Show Heatmap" : "Show Path"}
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={15}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Heat Mode */}
        {mode === "heat" && points.length > 0 && (
          <HeatMapLayer points={points} />
        )}

        {/* Path Mode */}
        {mode === "path" && path.length > 1 && (
          <Polyline
            positions={path}
            pathOptions={{ color: "lime", weight: 4 }}
          />
        )}

        {/* Live Marker */}
        {live && (
          <Marker position={[live.latitude, live.longitude]} />
        )}
      </MapContainer>
    </div>
  );
}
