import { useState } from "react";
import { commandApi } from "./commandApi";

export default function CommandForm({ deviceId, onSent }: any) {
  const [type, setType] = useState("TAKE_SCREENSHOT");

  async function send() {
    await commandApi.create({
      device_id: deviceId,
      command_type: type,
      parameters: {}
    });
    onSent();
  }

  return (
    <div className="flex gap-2 p-2 border-b">
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="select"
      >
        <option value="TAKE_SCREENSHOT">Take Screenshot</option>
        <option value="RECORD_AUDIO">Record Audio</option>
        <option value="EXECUTE_SHELL">Execute Shell</option>
        <option value="LOCK_DEVICE">Lock Device</option>
        <option value="WIPE_DATA">Wipe Data</option>
      </select>

      <button className="btn btn-primary" onClick={send}>
        Send Command
      </button>
    </div>
  );
}
