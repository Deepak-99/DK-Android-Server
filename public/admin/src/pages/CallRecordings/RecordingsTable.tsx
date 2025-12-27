import { CallRecording } from "./types";

export default function RecordingsTable({
                                            items,
                                            selected,
                                            toggle
                                        }: any) {
    return (
        <table className="w-full text-sm">
            <thead>
            <tr>
                <th></th>
                <th>Number</th>
                <th>Duration</th>
                <th>Size</th>
                <th>Date</th>
            </tr>
            </thead>

            <tbody>
            {items.map((r: CallRecording) => (
                <tr key={r.id} className="border-b border-border">
                    <td>
                        <input
                            type="checkbox"
                            checked={selected.includes(r.id)}
                            onChange={() => toggle(r.id)}
                        />
                    </td>
                    <td>{r.contact_name || r.phone_number}</td>
                    <td>{r.duration}s</td>
                    <td>{(r.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
