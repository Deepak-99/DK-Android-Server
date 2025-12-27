export default function CallStats({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-4 gap-4 p-4">
            <Stat label="Total Calls" value={stats.total} />
            <Stat label="Incoming" value={stats.incoming} />
            <Stat label="Outgoing" value={stats.outgoing} />
            <Stat label="Missed" value={stats.missed} />
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-neutral-900 p-4 rounded-lg">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-bold">{value}</div>
        </div>
    );
}
