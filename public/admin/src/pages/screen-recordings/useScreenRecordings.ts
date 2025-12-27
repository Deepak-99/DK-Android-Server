import { useEffect, useState } from "react";
import { screenRecordingApi } from "./screenRecordingApi";
import { ScreenRecording } from "./types";
import { useWebSocket } from "@/hooks/useWebSocket";

export function useScreenRecordings(deviceId: string) {
    const [files, setFiles] = useState<ScreenRecording[]>([]);
    const [active, setActive] = useState<ScreenRecording | null>(null);

    async function load() {
        const res = await screenRecordingApi.list(deviceId);
        setFiles(res.data || []);
    }

    useEffect(() => {
        load();
    }, [deviceId]);

    useWebSocket("file.new", (file) => {
        if (file.path?.includes(`/recordings/${deviceId}`)) {
            setFiles((f) => [file, ...f]);
        }
    });

    useWebSocket("file.deleted", (file) => {
        setFiles((f) => f.filter(x => x.path !== file.path));
        if (active?.path === file.path) setActive(null);
    });

    return { files, active, setActive, reload: load };
}
