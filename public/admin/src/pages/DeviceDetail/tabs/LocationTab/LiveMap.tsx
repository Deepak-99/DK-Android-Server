import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

export default function LiveMap({ latest }: { latest: any }) {
    if (!latest) return null;

    const position: [number, number] = [latest.latitude, latest.longitude];

    return (
        <div className="h-[350px] rounded-xl overflow-hidden bg-card border border-border">
            <MapContainer center={position} zoom={15} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker position={position}>
                    <Popup>
                        <div>
                            <strong>Current Location</strong>
                            <br />
                            Accuracy: {latest.accuracy}m <br />
                            Speed: {latest.speed} km/h
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
