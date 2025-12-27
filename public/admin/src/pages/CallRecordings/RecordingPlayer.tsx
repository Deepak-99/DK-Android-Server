export default function RecordingPlayer({ src }: { src: string }) {
    return (
        <div className="bg-neutral-900 p-4 rounded-lg">
            <audio controls preload="metadata" className="w-full">
                <source src={src} />
            </audio>
        </div>
    );
}
