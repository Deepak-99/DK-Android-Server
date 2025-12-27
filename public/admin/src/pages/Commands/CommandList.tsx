import { CommandItem } from "./types";

export default function CommandList({
                                        list,
                                        onSelect
                                    }: {
    list: CommandItem[];
    onSelect: (c: CommandItem) => void;
}) {
    return (
        <div className="border-r border-border w-96 h-full overflow-y-auto">
            {list.map((cmd) => (
                <div
                    key={cmd.id}
                    className="p-4 border-b border-border hover:bg-accent cursor-pointer"
                    onClick={() => onSelect(cmd)}
                >
                    <div className="flex justify-between">
                        <span>{cmd.command_type}</span>
                        <span className="text-xs text-muted-foreground">
              {cmd.status}
            </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {new Date(cmd.created_at).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
