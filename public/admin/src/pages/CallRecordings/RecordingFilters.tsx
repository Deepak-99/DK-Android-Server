import { useState } from "react";

export default function RecordingFilters({ onFilter }: { onFilter: (f: any) => void }) {
    const [search, setSearch] = useState("");
    const [direction, setDirection] = useState("");
    const [minDur, setMinDur] = useState("");
    const [maxDur, setMaxDur] = useState("");

    return (
        <div className="p-4 border-b border-border flex gap-4 items-end">
            <div className="flex flex-col">
                <label className="text-xs">Search</label>
                <input
                    className="input"
                    placeholder="Phone number"
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex flex-col">
                <label className="text-xs">Direction</label>
                <select className="input" onChange={(e) => setDirection(e.target.value)}>
                    <option value="">All</option>
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                </select>
            </div>

            <div className="flex flex-col">
                <label className="text-xs">Min Duration</label>
                <input type="number" className="input" onChange={(e) => setMinDur(e.target.value)} />
            </div>

            <div className="flex flex-col">
                <label className="text-xs">Max Duration</label>
                <input type="number" className="input" onChange={(e) => setMaxDur(e.target.value)} />
            </div>

            <button
                onClick={() =>
                    onFilter({
                        search,
                        direction,
                        minDuration: minDur ? Number(minDur) : undefined,
                        maxDuration: maxDur ? Number(maxDur) : undefined
                    })
                }
                className="btn-primary px-4"
            >
                Apply
            </button>
        </div>
    );
}
