import { CommandDTO } from "@/types/commands";

export default function CommandHistory({ history }: { history: CommandDTO[] }) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            {history.map((cmd) => (
                <div key={cmd.id} className="px-4 py-3 border-b border-border">
                    <div className="flex justify-between">
                        <div>
                            <div className="font-semibold">{cmd.command_type}</div>
                            {cmd.result && (
                                <div className="text-muted-foreground text-sm mt-1">
                                    {cmd.result}
                                </div>
                            )}
                        </div>
                        <div className="text-sm capitalize">{cmd.status}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
