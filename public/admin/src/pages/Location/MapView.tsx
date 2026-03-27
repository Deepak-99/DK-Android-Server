import {useEffect, useMemo, useRef, useState} from "react";
import "leaflet/dist/leaflet.css";

interface Props {
  lat: number;
  lng: number;
}

export default function MapView({ lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const L = (window as any).L;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([lat, lng], 13);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      }
    ).addTo(map);

    L.marker([lat, lng]).addTo(map);

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-xl border border-border"
    />
  );
}