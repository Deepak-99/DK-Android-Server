import { useState, useEffect } from "react";
import { useRecordings } from "./useRecordings";
import { recordingsApi } from "@/services/recordingsApi";
import RecordingStats from "./RecordingStats";
import RecordingsTable from "./RecordingsTable";
import RecordingToolbar from "./RecordingToolbar";
import RecordingPlayer from "./RecordingPlayer";
import { downloadRecording } from "./downloadQueue";

export default function CallRecordingsPage({ deviceId }: any) {
  const { items, reload } = useRecordings(deviceId);
  const [stats, setStats] = useState<any>({});
  const [selected, setSelected] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    recordingsApi.stats(deviceId).then(r => setStats(r.data));
  }, [deviceId]);

  function toggle(id: number) {
    setSelected(s =>
      s.includes(id) ? s.filter(i => i !== id) : [...s, id]
    );
  }

  async function bulkDelete() {
    for (const id of selected) {
      await recordingsApi.delete(id);
    }
    setSelected([]);
    reload();
  }

  function bulkDownload() {
    selected.forEach(id =>
      downloadRecording(id, `recording-${id}.mp3`)
    );
  }

  return (
    <div className="flex flex-col h-full">
      <RecordingStats stats={stats} />

      <RecordingToolbar
        selected={selected}
        onDelete={bulkDelete}
        onDownload={bulkDownload}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <RecordingsTable
            items={items}
            selected={selected}
            toggle={toggle}
          />
        </div>

        {active && (
          <div className="w-96 border-l border-border p-4">
            <RecordingPlayer src={`/calls/recording/${active}`} />
          </div>
        )}
      </div>
    </div>
  );
}
