import FileRow from "./FileRow";

export default function ExplorerView({ files, navigate }: any) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            {files.map((f: any) => (
                <FileRow
                    key={f.path}
                    entry={f}
                    onOpen={(entry) => navigate(entry.path)}
                />
            ))}
        </div>
    );
}
