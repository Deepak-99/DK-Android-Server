import ExplorerToolbar from "./ExplorerToolbar";
import ExplorerView from "./ExplorerView";
import UploadDialog from "./UploadDialog";
import { useFileExplorer } from "./useFileExplorer";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";

export default function FileExplorerPage() {
    const explorer = useFileExplorer();
    const [uploadOpen, setUploadOpen] = useState(false);

    return (
        <div className="space-y-5 p-5">
            <ExplorerToolbar
                cwd={explorer.cwd}
                back={explorer.back}
                forward={explorer.forward}
                refresh={explorer.refresh}
                onUpload={() => setUploadOpen(true)}
                onMkdir={() => {
                    const name = prompt("Folder name:");
                    if (name) fileApi.mkdir(explorer.cwd, name).then(explorer.refresh);
                }}
            />

            {explorer.loading ? (
                <div className="text-center p-5">Loading…</div>
            ) : (
                <ExplorerView files={explorer.files} navigate={explorer.navigate} />
            )}

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <UploadDialog cwd={explorer.cwd} onClose={() => setUploadOpen(false)} />
            </Dialog>
        </div>
    );
}
