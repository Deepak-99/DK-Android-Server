import { useEffect, useState } from "react";
import { fileApi, FileEntry } from "@/services/fileApi";
import { ws } from "@/services/ws";

export function useFileExplorer() {
    const [cwd, setCwd] = useState("/");
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<string[]>(["/"]);
    const [index, setIndex] = useState(0);

    async function load(path = cwd) {
        setLoading(true);
        const res = await fileApi.list(path);
        setFiles(res.data || []);
        setLoading(false);
    }

    function navigate(path: string) {
        setCwd(path);
        const newHistory = history.slice(0, index + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setIndex(newHistory.length - 1);
        load(path);
    }

    function back() {
        if (index === 0) return;
        const p = history[index - 1];
        setIndex(index - 1);
        setCwd(p);
        load(p);
    }

    function forward() {
        if (index >= history.length - 1) return;
        const p = history[index + 1];
        setIndex(index + 1);
        setCwd(p);
        load(p);
    }

    async function refresh() {
        load(cwd);
    }

    // Live file change updates from server
    useEffect(() => {
        ws.subscribe("file_update", (payload) => {
            if (payload.path.startsWith(cwd)) refresh();
        });

        load(cwd);
    }, []);

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
