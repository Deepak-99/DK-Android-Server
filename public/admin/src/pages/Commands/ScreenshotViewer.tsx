export default function ScreenshotViewer({
                                             url,
                                             onClose
                                         }: {
    url: string;
    onClose: () => void;
}) {
    if (!url) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-neutral-900 p-4 rounded">
                <img src={url} className="max-h-[90vh]" />
                <button className="btn mt-4" onClick={onClose}>Close</button>
            </div>
        </div>
    );
}
