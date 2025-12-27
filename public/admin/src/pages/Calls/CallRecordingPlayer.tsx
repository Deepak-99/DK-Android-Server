export default function CallRecordingPlayer({ src }: { src: string }) {
    return (
        <audio controls className="w-full mt-4">
            <source src={src} type="audio/mpeg" />
        </audio>
    );
}
