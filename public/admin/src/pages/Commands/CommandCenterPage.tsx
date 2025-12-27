import { useState } from "react";
import { useCommands } from "./useCommands";
import CommandQueue from "./CommandQueue";
import CommandForm from "./CommandForm";
import CommandResultViewer from "./CommandResultViewer";

export default function CommandCenterPage({ deviceId }: any) {
    const { commands, reload } = useCommands(deviceId);
    const [active, setActive] = useState(null);

    return (
        <div className="flex h-full">
            <CommandQueue
                commands={commands}
                onSelect={setActive}
            />

            <div className="flex flex-col flex-1">
                <CommandForm deviceId={deviceId} onSent={reload} />
                <CommandResultViewer command={active} />
            </div>
        </div>
    );
}
