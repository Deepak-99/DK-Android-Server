export default function RecordingList({ files, selected, onSelect }: any) {
    return (
        <div className="w-80 border-r border-border overflow-y-auto">
            {files.map((f: any) => (
                <div
                    key={f.path}
                    onClick={() => onSelect(f)}
                    className={`p-3 cursor-pointer hover:bg-neutral-800 ${
                        selected?.path === f.path ? "bg-neutral-800" : ""
                    }`}
                >
                    <div className="text-sm font-medium truncate">{f.name}</div>
                    <div className="text-xs opacity-60">
                        {(f.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                        {new Date(f.modified).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
