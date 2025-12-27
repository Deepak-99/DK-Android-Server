export default function CommandQueue({ commands, onSelect }: any) {
    return (
        <div className="w-96 border-r overflow-y-auto">
            {commands.map((cmd: any) => (
                <div
                    key={cmd.id}
                    onClick={() => onSelect(cmd)}
                    className="p-3 cursor-pointer hover:bg-muted"
                >
                    <div className="font-medium">{cmd.command_type}</div>
                    <div className="text-xs opacity-60">
                        {cmd.status} · {new Date(cmd.created_at).toLocaleTimeString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
