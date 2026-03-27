import { useEffect, useRef } from "react";
import { subscribe } from "@/services/websocket";

interface Props {
  lat: number;
  lng: number;
}

export default function LiveMap({ lat, lng }: Props) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;

    mapRef.current = L.map("liveMap").setView([lat, lng], 14);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    ).addTo(mapRef.current);

    markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);

    const unsubscribe = subscribe((event: any) => {
      if (event.type === "location_update") {
        const { latitude, longitude } = event.payload;

        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.panTo([latitude, longitude]);
      }
    });

    return () => {
      unsubscribe?.();
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div
      id="liveMap"
      className="h-[400px] w-full rounded-xl border border-border"
    />
  );
}