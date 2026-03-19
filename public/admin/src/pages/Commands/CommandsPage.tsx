import { useEffect, useState } from "react";
import { useCommands } from "./useCommands";
import CommandCreator from "./CommandCreator";
import CommandList from "./CommandList";
import CommandOutput from "./CommandOutput";
import ScreenshotViewer from "./ScreenshotViewer";
import api from "../../api/axios";
import { subscribe } from "../../services/websocket";

interface CommandEvent {
  type: string;
}

export default function CommandsPage({ deviceId }: { deviceId: string }) {
  const { list, loading, send } = useCommands(deviceId);

  const [selected, setSelected] = useState<any | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [commands, setCommands] = useState<any[]>([]);

  /* ---------------------------
     Load commands from API
  ---------------------------- */

  const loadCommands = async () => {
    try {
      const res = await api.get("/commands", {
        params: { deviceId }
      });

      setCommands(res.data || []);
    } catch (err) {
      console.error("Failed to load commands", err);
    }
  };

  /* ---------------------------
     Initial load
  ---------------------------- */

  useEffect(() => {
    void loadCommands();
  }, [deviceId]);

  /* ---------------------------
     WebSocket live updates
  ---------------------------- */

  useEffect(() => {
    const unsubscribe = subscribe((event: CommandEvent) => {
      if (event.type === "command_response") {
        void loadCommands();
      }

      if (event.type === "screenshot.new") {
        const payload = event as any;

        if (payload.device_id === deviceId) {
          setScreenshotUrl(payload.url);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [deviceId]);

  /* ---------------------------
     Send command helper
  ---------------------------- */

  async function submit(type: string, params: any) {
    try {
      await send(type as any, params);
      await loadCommands();
    } catch (err) {
      console.error("Failed to send command", err);
    }
  }

  /* ---------------------------
     Loading UI
  ---------------------------- */

  if (loading) {
    return <div className="p-6">Loading commands…</div>;
  }

  /* ---------------------------
     Render
  ---------------------------- */

  return (
    <div className="flex h-full">

      {/* LEFT PANEL */}
      <div className="flex flex-col h-full w-96 border-r border-border">

        <CommandCreator deviceId={deviceId} />

        <CommandList
          list={list}
          onSelect={setSelected}
        />

      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col flex-1">

        <CommandOutput cmd={selected} />

        {screenshotUrl && (
          <ScreenshotViewer
            url={screenshotUrl}
            onClose={() => setScreenshotUrl(null)}
          />
        )}

      </div>

    </div>
  );
}
