import { useScreenRecordings } from "./useScreenRecordings";
import RecordingList from "./RecordingList";
import RecordingPlayer from "./RecordingPlayer";
import RecordingToolbar from "./RecordingToolbar";
import { screenRecordingApi } from "@/services/screenRecordingApi";

export default function ScreenRecordingsPage({ deviceId }: any) {
    const { files, selected, setSelected, reload } =
        useScreenRecordings(deviceId);

    async function handleDelete(path: string) {
        if (!confirm("Delete this recording?")) return;
        await screenRecordingApi.delete(path);
        reload();
    }

    return (
        <div className="flex h-full">
            <RecordingList
                files={files}
                selected={selected}
                onSelect={setSelected}
            />

            <div className="flex flex-col flex-1">
                <RecordingToolbar file={selected} onDelete={handleDelete} />
                <RecordingPlayer
                    file={selected}
                    streamUrl={screenRecordingApi.streamUrl}
                />
            </div>
        </div>
    );
}
