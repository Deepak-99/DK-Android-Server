export default function LocationStats({ points, live }: any) {
    if (!points.length) return null;

    return (
        <div className="text-xs space-y-1">
            <div>Total Points: {points.length}</div>
            <div>
                Last Seen:{" "}
                {live ? new Date(live.timestamp).toLocaleString() : "-"}
            </div>
            {live?.speed && <div>Speed: {live.speed} m/s</div>}
            {live?.accuracy && <div>Accuracy: ±{live.accuracy} m</div>}
        </div>
    );
}
