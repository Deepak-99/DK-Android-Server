export default function RecordingToolbar({ file, onDelete }: any) {
    if (!file) return null;

    return (
        <div className="p-2 flex gap-2 border-b border-border">
            <a
                href={`/files/download?path=${encodeURIComponent(file.path)}`}
                className="btn btn-secondary"
            >
                Download
            </a>

            <button
                onClick={() => onDelete(file.path)}
                className="btn btn-destructive"
            >
                Delete
            </button>
        </div>
    );
}
