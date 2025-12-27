export default function ScreenControls({ active, start, stop }: any) {
    return (
        <div className="p-2 border-b flex gap-2">
            {!active ? (
                <button className="btn btn-primary" onClick={start}>
                    Start Screen
                </button>
            ) : (
                <button className="btn btn-destructive" onClick={stop}>
                    Stop Screen
                </button>
            )}
        </div>
    );
}
