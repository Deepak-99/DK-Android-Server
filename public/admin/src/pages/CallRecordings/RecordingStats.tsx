export default function RecordingStats({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-3 gap-4 p-4">
            <Stat label="Total Recordings" value={stats.total} />
            <Stat label="Storage Used" value={stats.storage_human} />
            <Stat label="Avg Duration" value={`${stats.avg_duration}s`} />
        </div>
    );
}

function Stat({ label, value }: any) {
    return (
        <div className="bg-neutral-900 rounded-lg p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-lg font-bold">{value}</div>
        </div>
    );
}
