import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ points, live }: any) {
    const path = points.map((p: any) => [p.latitude, p.longitude]);

    const center = live
        ? [live.latitude, live.longitude]
        : path[0] || [0, 0];

    return (
        <MapContainer center={center} zoom={15} className="h-full w-full">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {path.length > 1 && (
                <Polyline positions={path} color="lime" />
            )}

            {live && (
                <Marker position={[live.latitude, live.longitude]} />
            )}
        </MapContainer>
    );
}
