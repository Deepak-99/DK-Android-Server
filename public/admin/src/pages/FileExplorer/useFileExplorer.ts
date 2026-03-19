import { useEffect, useState, useCallback } from "react";
import { fileApi, FileEntry } from "../../services/fileApi";
import { subscribe } from "../../services/websocket";

interface FileUpdateEvent {
    type: string;
    payload: {
        path: string;
        action: "created" | "deleted" | "modified";
    };
}

export function useFileExplorer() {

    const [cwd, setCwd] = useState("/");
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const [history, setHistory] = useState<string[]>(["/"]);
    const [index, setIndex] = useState(0);

    // -----------------------------
    // Load Files (Safe + Stable)
    // -----------------------------
    const load = useCallback(async (path: string) => {
        try {
            setLoading(true);

            const res = await fileApi.list(path);

            setFiles(res.data || []);
        } catch (err) {
            console.error("Failed to load files:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // -----------------------------
    // Navigation
    // -----------------------------
    const navigate = useCallback((path: string) => {

        setCwd(path);

        setHistory(prev => {
            const newHistory = prev.slice(0, index + 1);
            newHistory.push(path);
            return newHistory;
        });

        setIndex(prev => prev + 1);

        void load(path);

    }, [index, load]);

    const back = useCallback(() => {
        if (index === 0) return;

        const p = history[index - 1];

        setIndex(prev => prev - 1);
        setCwd(p);

        void load(p);

    }, [history, index, load]);

    const forward = useCallback(() => {
        if (index >= history.length - 1) return;

        const p = history[index + 1];

        setIndex(prev => prev + 1);
        setCwd(p);

        void load(p);

    }, [history, index, load]);

    // -----------------------------
    // Refresh
    // -----------------------------
    const refresh = useCallback(async () => {
        await load(cwd);
    }, [cwd, load]);

    // -----------------------------
    // Initial Load + WebSocket
    // -----------------------------
    useEffect(() => {

        void load(cwd);

        const unsubscribe = subscribe((event: FileUpdateEvent) => {

            if (
                event?.type === "file_update" &&
                event.payload?.path?.startsWith(cwd)
            ) {
                void refresh();
            }
        });

        return () => {
            unsubscribe();
        };

    }, [cwd, load, refresh]);

    return {
        cwd,
        files,
        loading,
        navigate,
        back,
        forward,
        refresh
    };
}
