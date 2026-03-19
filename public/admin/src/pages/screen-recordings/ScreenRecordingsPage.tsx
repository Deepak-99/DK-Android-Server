import { useScreenRecordings } from "./useScreenRecordings";
import { screenRecordingApi } from "../../services/screenRecordingApi";
import RecordingList from "./RecordingList";
import RecordingPlayer from "./RecordingPlayer";
import RecordingToolbar from "./RecordingToolbar";
import { ScreenRecordingControls } from "./ScreenRecordingControls";

interface Props {
  deviceId: string;
}

export default function ScreenRecordingsPage({ deviceId }: Props) {
  const { files, active, setActive, reload } =
    useScreenRecordings(deviceId);

  async function handleDelete(path: string) {
    if (!confirm("Delete this recording?")) return;
    await screenRecordingApi.delete(path);
    reload();
  }

  return (
    <div className="flex h-full border border-border rounded-lg overflow-hidden">

      {/* Left Panel - Recording List */}
      <RecordingList
        files={files}
        active={active}
        onSelect={setActive}
      />

      {/* Right Panel */}
      <div className="flex flex-col flex-1">

        {/* 🔴 Start / Stop Recording Controls */}
        <div className="p-3 border-b border-border bg-neutral-900">
          <ScreenRecordingControls deviceId={deviceId} />
        </div>

        {/* 🛠 Toolbar (Download / Delete) */}
        <RecordingToolbar
          file={active}
          onDelete={handleDelete}
        />

        {/* 🎬 Video Player */}
        <RecordingPlayer
          file={active}
          stream={screenRecordingApi.stream}
        />
      </div>
    </div>
  );
}
