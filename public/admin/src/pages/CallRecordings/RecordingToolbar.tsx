export default function RecordingToolbar({
                                             selected,
                                             onDelete,
                                             onDownload
                                         }: any) {
    return (
        <div className="flex gap-2 p-2 border-b border-border">
            <button
                disabled={!selected.length}
                className="btn btn-danger"
                onClick={onDelete}
            >
                Delete
            </button>

            <button
                disabled={!selected.length}
                className="btn"
                onClick={onDownload}
            >
                Download
            </button>
        </div>
    );
}
