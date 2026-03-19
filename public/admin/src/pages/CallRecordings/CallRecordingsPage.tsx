import { useState, useEffect } from "react";
import { useRecordings } from "./useRecordings";
import { recordingsApi } from "../../services/recordingsApi";
import RecordingStats from "./RecordingStats";
import RecordingsTable from "./RecordingsTable";
import RecordingToolbar from "./RecordingToolbar";
import RecordingPlayer from "./RecordingPlayer";
import { downloadRecording } from "./downloadQueue";

export default function CallRecordingsPage({ deviceId }: { deviceId: string }) {
  const { items, reload } = useRecordings(deviceId);

  const [stats, setStats] = useState<any>({});
  const [selected, setSelected] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null); // ✅ UI error state

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await recordingsApi.stats(deviceId);
        setStats(res.data);
      } catch {
        setError("Failed to load recording statistics");
      }
    };

    loadStats();
  }, [deviceId]);

  function toggle(id: number) {
    setSelected((s) =>
      s.includes(id) ? s.filter((i) => i !== id) : [...s, id]
    );
  }

  async function bulkDelete() {
    try {
      for (const id of selected) {
        await recordingsApi.delete(id);
      }

      setSelected([]);
      await reload();

    } catch {
      setError("Failed to delete recordings");
    }
  }

  function bulkDownload() {
    selected.forEach((id) =>
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
            onSelectActive={setActive}   /* optional: if supported */
          />
        </div>

        {active !== null && (
          <div className="w-96 border-l border-border p-4">
            <RecordingPlayer src={`/calls/recording/${active}`} />
          </div>
        )}
      </div>

      {/* ✅ Proper UI error rendering */}
      {error && (
        <div className="error-box p-3 text-red-500 bg-red-50 border border-red-200 rounded mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
