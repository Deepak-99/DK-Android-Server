export default function RecordingToolbar({ file, onDelete }: any) {
    if (!file) return null;

    return (
        <div className="p-2 border-b flex gap-2">
            <a
                className="btn btn-secondary"
                href={`/files/download?path=${encodeURIComponent(file.path)}`}
            >
                Download
            </a>

            <button
                className="btn btn-destructive"
                onClick={() => onDelete(file.path)}
            >
                Delete
            </button>
        </div>
    );
}
