import { useScreenRecordings } from "./useScreenRecordings";
import { screenRecordingApi } from "./screenRecordingApi";
import RecordingList from "./RecordingList";
import RecordingPlayer from "./RecordingPlayer";
import RecordingToolbar from "./RecordingToolbar";

export default function ScreenRecordingsPage({ deviceId }: any) {
    const { files, active, setActive, reload } =
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
                active={active}
                onSelect={setActive}
            />

            <div className="flex flex-col flex-1">
                <RecordingToolbar
                    file={active}
                    onDelete={handleDelete}
                />
                <RecordingPlayer
                    file={active}
                    stream={screenRecordingApi.stream}
                />
            </div>
        </div>
    );
}
