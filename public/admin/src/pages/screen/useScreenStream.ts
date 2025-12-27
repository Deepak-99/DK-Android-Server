import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

export function useScreenStream(deviceId: string) {
    const [active, setActive] = useState(false);
    const frameRef = useRef<string | null>(null);

    useWebSocket("screen.frame", (payload: any) => {
        if (payload.deviceId !== deviceId) return;
        frameRef.current = `data:image/jpeg;base64,${payload.data}`;
    });

    function start() {
        setActive(true);
        window.wsEmit("screen.start", {
            deviceId,
            quality: 70,
            fps: 10
        });
    }

    function stop() {
        setActive(false);
        window.wsEmit("screen.stop", { deviceId });
    }

    return {
        active,
        frameRef,
        start,
        stop
    };
}
