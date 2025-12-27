import LiveMap from "./LiveMap";
import HistoryMap from "./HistoryMap";
import HeatMap from "./HeatMap";
import LocationTimeline from "./LocationTimeline";
import { useLocationData } from "./useLocationData";

export default function LocationTab({ deviceId }: { deviceId: string }) {
    const { latest, history, loading } = useLocationData(deviceId);

    if (loading) return <div>Loading location…</div>;

    return (
        <div className="space-y-6 mt-5">
            <LiveMap latest={latest} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HistoryMap history={history} />
                <HeatMap history={history} />
            </div>

            <LocationTimeline history={history} />
        </div>
    );
}
