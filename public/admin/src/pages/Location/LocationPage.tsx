import { useLocation } from "./useLocation";
import MapView from "./MapView";
import Timeline from "./Timeline";
import LocationStats from "./LocationStats";

export default function LocationPage({ deviceId }: any) {
    const { points, live } = useLocation(deviceId);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                <MapView points={points} live={live} />
            </div>

            <div className="p-2 bg-neutral-900 border-t border-border">
                <LocationStats points={points} live={live} />
                <Timeline points={points} />
            </div>
        </div>
    );
}
