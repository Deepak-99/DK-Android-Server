import { Button } from "@mui/material";

export default function ExplorerToolbar({
                                            cwd,
                                            back,
                                            forward,
                                            refresh,
                                            onUpload,
                                            onMkdir
                                        }: any) {
    return (
        <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
            <Button onClick={back}>⬅</Button>
            <Button onClick={forward}>➡</Button>
            <Button onClick={refresh}>🔄</Button>

            <div className="flex-1 px-4 py-2 bg-muted rounded-md text-sm">
                {cwd}
            </div>

            <Button onClick={onUpload}>⬆ Upload</Button>
            <Button onClick={onMkdir}>📁 New Folder</Button>
        </div>
    );
}
