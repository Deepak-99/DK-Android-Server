import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { wsEmit } from "../../services/websocket";

interface ScreenFramePayload {
  deviceId: string;
  data: string;
}

export function useScreenStream(deviceId: string) {

  const [active, setActive] = useState(false);
  const frameRef = useRef<string | null>(null);

  useWebSocket<ScreenFramePayload>("screen.frame", (payload) => {
    if (payload.deviceId !== deviceId) return;

    frameRef.current = `data:image/jpeg;base64,${payload.data}`;
  });

  function start() {
    setActive(true);

    wsEmit("screen.start", {
      deviceId,
      quality: 70,
      fps: 10
    });
  }

  function stop() {
    setActive(false);
    wsEmit("screen.stop", { deviceId });
  }

  return {
    active,
    frameRef,
    start,
    stop
  };
}
