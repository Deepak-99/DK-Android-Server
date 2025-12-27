export default function Timeline({ points, onSelect }: any) {
    return (
        <div className="p-2 flex gap-1 overflow-x-auto">
            {points.map((p: any) => (
                <button
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className="text-xs px-2 py-1 bg-neutral-800 rounded"
                >
                    {new Date(p.timestamp).toLocaleTimeString()}
                </button>
            ))}
        </div>
    );
}
