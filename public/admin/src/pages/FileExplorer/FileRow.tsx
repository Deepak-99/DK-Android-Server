import { downloadManager } from "@/services/downloadManager";
import { fileApi } from "@/services/fileApi";

export default function FileRow({ entry, onOpen }: any) {
    const download = () => {
        downloadManager.enqueue({
            id: crypto.randomUUID(),
            path: entry.path,
            filename: entry.name,
            start: async () => {
                const res = await fileApi.download(entry.path);
                const blob = new Blob([res.data]);
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = entry.name;
                a.click();

                URL.revokeObjectURL(url);
            }
        });
    };

    const remove = async () => {
        await fileApi.delete(entry.path);
    };

    return (
        <div
            className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer"
            onDoubleClick={() => entry.type === "dir" && onOpen(entry)}
        >
            <div>
                {entry.type === "dir" ? "📁" : "📄"} {entry.name}
            </div>

            <div className="flex gap-3">
                {entry.type === "file" && (
                    <button className="text-blue-400" onClick={(e) => { e.stopPropagation(); download(); }}>Download</button>
                )}
                <button className="text-red-400" onClick={(e) => { e.stopPropagation(); remove(); }}>Delete</button>
            </div>
        </div>
    );
}
