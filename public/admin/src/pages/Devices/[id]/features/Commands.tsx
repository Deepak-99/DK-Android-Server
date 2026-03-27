import { useEffect, useState } from "react";
import { Play, Loader2 } from "lucide-react";
import api from "@/services/api";
import { showToast } from "@/utils/toast";
import { subscribe } from "@/services/websocket";
import CommandResultModal from "@/pages/Commands/CommandResultModal";

interface Props {
  deviceId: string;
}

export default function Commands({ deviceId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const commands = [
    "take_screenshot",
    "get_location",
    "lock_device",
    "restart",
    "sync_data"
  ];

  useEffect(() => {
    const unsub = subscribe((event: any) => {
      if (event.type === "command_result") {
        setResult(event.payload);
        setOpen(true);
        setLoading(null);
      }
    });

    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, []);

  const sendCommand = async (cmd: string) => {
    try {
      setLoading(cmd);

      await api.post(`/commands`, {
        deviceId,
        command: cmd
      });

      showToast("Command sent", "success");
    } catch {
      showToast("Command failed", "error");
      setLoading(null);
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">

        <div>
          <h2 className="font-semibold">
            Command Center
          </h2>
          <p className="text-sm text-muted">
            Execute remote commands on device
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {commands.map(cmd => (
            <button
              key={cmd}
              onClick={() => sendCommand(cmd)}
              className="bg-bg border border-border rounded-lg
                         hover:border-accent transition p-3
                         flex items-center justify-between"
            >
              <span className="text-sm">{cmd}</span>

              {loading === cmd ? (
                <Loader2 className="animate-spin" size={16}/>
              ) : (
                <Play size={14}/>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="bg-bg border border-border rounded-lg p-3 text-sm text-muted flex items-center gap-2">
            <Loader2 className="animate-spin" size={16}/>
            Executing command...
          </div>
        )}

      </div>

      <CommandResultModal
        open={open}
        result={result}
        onClose={() => setOpen(false)}
      />
    </>
  );
}