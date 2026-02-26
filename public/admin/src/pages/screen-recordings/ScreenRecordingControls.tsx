import { wsEmit } from "../../services/websocket";

interface Props {
  deviceId: string;
}

export function ScreenRecordingControls({ deviceId }: Props) {

  function start() {
    wsEmit("screen.record.start", { deviceId });
  }

  function stop() {
    wsEmit("screen.record.stop", { deviceId });
  }

  return (
    <div className="flex gap-2">
      <button onClick={start} className="btn btn-danger">
        Start Recording
      </button>
      <button onClick={stop} className="btn">
        Stop
      </button>
    </div>
  );
}
