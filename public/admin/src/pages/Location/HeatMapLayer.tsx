import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet.heat";

interface HeatPoint {
  latitude: number;
  longitude: number;
  intensity?: number;
}

interface HeatMapProps {
  points: HeatPoint[];
}

export default function HeatMapLayer({ points }: HeatMapProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const heatData: [number, number, number][] = points.map(p => [
      p.latitude,
      p.longitude,
      p.intensity ?? 0.5
    ]);

    const heatLayer = (L as any).heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
