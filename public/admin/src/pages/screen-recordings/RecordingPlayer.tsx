export default function RecordingPlayer({ file, stream }: any) {
    if (!file) {
        return (
            <div className="flex-1 flex items-center justify-center opacity-50">
                Select a screen recording
            </div>
        );
    }

    return (
        <div className="flex-1 bg-black flex items-center justify-center">
            <video
                controls
                preload="metadata"
                className="max-h-full max-w-full"
                src={stream(file.path)}
            />
        </div>
    );
}
