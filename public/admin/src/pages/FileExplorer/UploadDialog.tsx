import { fileApi } from "@/services/fileApi";

export default function UploadDialog({ cwd, onClose }: any) {
    async function selectFiles(e: any) {
        const files = Array.from(e.target.files);
        for (const f of files) {
            await fileApi.upload(cwd, f);
        }
        onClose();
    }

    return (
        <div className="p-5 space-y-3">
            <h2 className="font-semibold">Upload Files</h2>
            <input type="file" multiple onChange={selectFiles} />
        </div>
    );
}
