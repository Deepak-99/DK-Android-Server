import { useState } from "react";

export default function CallLogFilters({ onFilter }: { onFilter: (f: any) => void }) {
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [minDuration, setMinDuration] = useState("");
    const [maxDuration, setMaxDuration] = useState("");

    function apply() {
        onFilter({
            search,
            type,
            minDuration: minDuration ? Number(minDuration) : undefined,
            maxDuration: maxDuration ? Number(maxDuration) : undefined
        });
    }

    return (
        <div className="p-4 border-b border-border flex gap-4 items-end">
            <div className="flex flex-col">
                <label className="text-xs">Search</label>
                <input
                    className="bg-muted p-2 rounded-md"
                    placeholder="Name / Number"
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex flex-col">
                <label className="text-xs">Type</label>
                <select
                    className="bg-muted p-2 rounded-md"
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="">All</option>
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                    <option value="missed">Missed</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            <div className="flex flex-col">
                <label className="text-xs">Min Duration (s)</label>
                <input
                    className="bg-muted p-2 rounded-md"
                    type="number"
                    onChange={(e) => setMinDuration(e.target.value)}
                />
            </div>

            <div className="flex flex-col">
                <label className="text-xs">Max Duration (s)</label>
                <input
                    className="bg-muted p-2 rounded-md"
                    type="number"
                    onChange={(e) => setMaxDuration(e.target.value)}
                />
            </div>

            <button onClick={apply} className="btn-primary px-4 py-2">
                Apply
            </button>
        </div>
    );
}
