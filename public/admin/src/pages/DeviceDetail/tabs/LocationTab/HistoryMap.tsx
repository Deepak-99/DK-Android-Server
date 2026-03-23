import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function HistoryMap({ history }: { history: any[] }) {
  if (!history || history.length < 2) return null;

  const polyline: [number, number][] = history.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);


  return (
    <div className="h-[350px] rounded-xl overflow-hidden bg-card border border-border">
      <MapContainer
        center={polyline[0]}
        zoom={14}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={polyline}
          pathOptions={{
            color: "cyan",
            weight: 4,
            opacity: 0.9,
          }}
        />
      </MapContainer>
    </div>
  );
}
