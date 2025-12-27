import { useEffect, useState } from "react";
import { screenRecordingApi } from "@/services/screenRecordingApi";
import { ScreenRecording } from "./types";
import { useWebSocket } from "@/hooks/useWebSocket";

export function useScreenRecordings(deviceId: string) {
    const [files, setFiles] = useState<ScreenRecording[]>([]);
    const [selected, setSelected] = useState<ScreenRecording | null>(null);

    async function load() {
        const res = await screenRecordingApi.list(deviceId);
        setFiles(res.data || []);
    }

    useEffect(() => {
        load();
    }, [deviceId]);

    useWebSocket("file.new", (file) => {
        if (file.path?.includes(`/recordings/${deviceId}`)) {
            setFiles(f => [file, ...f]);
        }
    });

    useWebSocket("file.deleted", (file) => {
        setFiles(f => f.filter(x => x.path !== file.path));
        if (selected?.path === file.path) setSelected(null);
    });

    return { files, selected, setSelected, reload: load };
}
