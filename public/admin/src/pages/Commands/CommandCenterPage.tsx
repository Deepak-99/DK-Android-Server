import { useState } from "react";
import { useCommands } from "./useCommands";
import CommandQueue from "./CommandQueue";
import CommandForm from "./CommandForm";
import CommandResultViewer from "./CommandResultViewer";

export default function CommandCenterPage({ deviceId }: any) {

    const { list: commands, reload } = useCommands(deviceId);

    const [active, setActive] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="flex h-full">

            <CommandQueue
                commands={commands}
                onSelect={setActive}
            />

            <div className="flex flex-col flex-1">
                <CommandForm
                    deviceId={deviceId}
                    onSent={async () => {
                        try {
                            await reload();
                        } catch {
                            setError("Failed to reload commands");
                        }
                    }}
                />

                <CommandResultViewer command={active} />
            </div>

            {error && (
                <div className="error-box text-red-500 p-2">
                    {error}
                </div>
            )}

        </div>
    );
}
