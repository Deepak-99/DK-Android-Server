import ExplorerToolbar from "./ExplorerToolbar";
import ExplorerView from "./ExplorerView";
import UploadDialog from "./UploadDialog";
import { useFileExplorer } from "./useFileExplorer";
import { useState, useCallback } from "react";
import { fileApi } from "../../services/fileApi";
import { useQueryClient } from "@tanstack/react-query";

export default function FileExplorerPage() {

    const explorer = useFileExplorer();
    const queryClient = useQueryClient();

    const [uploadOpen, setUploadOpen] = useState(false);

    // -------------------------------
    // Optimized mkdir (reactive)
    // -------------------------------
    const handleMkdir = useCallback(async () => {

        const name = prompt("Folder name:");
        if (!name) return;

        try {
            await fileApi.mkdir(explorer.cwd, name);

            // Invalidate only this folder
            queryClient.invalidateQueries({
                queryKey: ["files", explorer.cwd]
            });

        } catch (err) {
            console.error("Failed to create folder", err);
        }

    }, [explorer.cwd, queryClient]);

    return (
        <div className="space-y-5 p-5">

            <ExplorerToolbar
                cwd={explorer.cwd}
                back={explorer.back}
                forward={explorer.forward}
                refresh={explorer.refresh}
                onUpload={() => setUploadOpen(true)}
                onMkdir={handleMkdir}
            />

            {explorer.loading ? (

                <div className="text-center p-8 text-text-dim">
                    Loading...
                </div>

            ) : (

                <ExplorerView
                    files={explorer.files}
                    navigate={explorer.navigate}
                />

            )}

            {uploadOpen && (
                <UploadDialog
                    cwd={explorer.cwd}
                    onClose={() => {
                        setUploadOpen(false);

                        // Refresh current folder after upload
                        queryClient.invalidateQueries({
                            queryKey: ["files", explorer.cwd]
                        });
                    }}
                />
            )}

        </div>
    );
}
