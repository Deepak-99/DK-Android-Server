import { COMMAND_PRESETS } from "./commandPresets";

export default function CommandTypeSelector({ onSelect }: any) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(COMMAND_PRESETS).map(([key, val]) => (
                <button
                    key={key}
                    onClick={() => onSelect(key, val.params)}
                    className="p-4 bg-card hover:bg-accent rounded-xl border border-border transition"
                >
                    <div className="font-semibold">{val.label}</div>
                </button>
            ))}
        </div>
    );
}
