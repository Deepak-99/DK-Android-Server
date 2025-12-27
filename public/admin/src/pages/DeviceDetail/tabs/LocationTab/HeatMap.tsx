import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet.heat";

function HeatLayer({ history }: { history: any[] }) {
    const map = useMap();

    const points = history.map((l) => [l.latitude, l.longitude, 0.5]);

    // @ts-ignore
    L.heatLayer(points, { radius: 25 }).addTo(map);

    return null;
}

export default function HeatMap({ history }: { history: any[] }) {
    if (history.length < 5) return null;

    return (
        <div className="h-[350px] rounded-xl overflow-hidden bg-card border border-border">
            <MapContainer center={[history[0].latitude, history[0].longitude]} zoom={14} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <HeatLayer history={history} />
            </MapContainer>
        </div>
    );
}
