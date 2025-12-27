export default function RecordingPlayer({ file, streamUrl }: any) {
    if (!file) {
        return (
            <div className="flex-1 flex items-center justify-center opacity-50">
                Select a recording
            </div>
        );
    }

    return (
        <div className="flex-1 bg-black flex items-center justify-center">
            <video
                src={streamUrl(file.path)}
                controls
                preload="metadata"
                className="max-h-full max-w-full"
            />
        </div>
    );
}
