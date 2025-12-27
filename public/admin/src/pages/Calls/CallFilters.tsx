export default function CallFilters({ onFilter }: { onFilter: (v: string) => void }) {
    return (
        <div className="flex gap-2 p-2">
            {["all", "incoming", "outgoing", "missed"].map(t => (
                <button key={t} className="btn" onClick={() => onFilter(t)}>
                    {t.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
