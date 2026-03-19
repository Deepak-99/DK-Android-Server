import { ChangeEvent } from "react";
import { fileApi } from "../../services/fileApi";

export default function UploadDialog({ cwd, onClose }: any) {

    async function selectFiles(e: ChangeEvent<HTMLInputElement>) {
        const fileList = e.target.files;

        if (!fileList) return;

        const files: File[] = Array.from(fileList);

        for (const file of files) {
            await fileApi.upload(cwd, file);
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
