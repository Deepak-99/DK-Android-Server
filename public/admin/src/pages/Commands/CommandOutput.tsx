import { CommandItem } from "./types";

export default function CommandOutput({ cmd }: { cmd: CommandItem | null }) {
    if (!cmd)
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a command
            </div>
        );

    return (
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <h2 className="text-xl font-bold">Command Output</h2>

            <div className="text-sm">
                <div>
                    <span className="text-muted-foreground">Type: </span>
                    {cmd.command_type}
                </div>

                <div>
                    <span className="text-muted-foreground">Status: </span>
                    {cmd.status}
                </div>

                <pre className="bg-black/30 p-4 rounded text-xs mt-4 overflow-x-auto">
          {JSON.stringify(cmd.result, null, 2)}
        </pre>
            </div>
        </div>
    );
}
