import { CallRecording } from "./types";

export default function RecordingList({
                                          recordings,
                                          onSelect
                                      }: {
    recordings: CallRecording[];
    onSelect: (r: CallRecording) => void;
}) {
    return (
        <div className="w-96 border-r border-border h-full overflow-y-auto">
            {recordings.map((r) => (
                <div
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className="p-4 border-b border-border hover:bg-accent cursor-pointer"
                >
                    <div className="flex justify-between">
                        <span className="capitalize text-primary">{r.direction}</span>
                        <span className="text-xs text-muted-foreground">
              {new Date(r.timestamp).toLocaleString()}
            </span>
                    </div>

                    <div className="text-lg mt-1">{r.phone_number}</div>

                    <div className="text-xs text-muted-foreground">
                        {Math.round(r.file_size / 1024)} KB — {r.duration}s
                    </div>
                </div>
            ))}
        </div>
    );
}
