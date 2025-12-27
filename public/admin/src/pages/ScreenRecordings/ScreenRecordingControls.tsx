export function ScreenRecordingControls({ deviceId }) {
    function start() {
        window.wsEmit("screen.record.start", { deviceId });
    }

    function stop() {
        window.wsEmit("screen.record.stop", { deviceId });
    }

    return (
        <div className="flex gap-2">
            <button onClick={start} className="btn btn-danger">
                Start Recording
            </button>
            <button onClick={stop} className="btn">
                Stop
            </button>
        </div>
    );
}
