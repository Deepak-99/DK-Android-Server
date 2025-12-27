export default function CommandResultViewer({ command }: any) {
    if (!command) {
        return (
            <div className="flex-1 flex items-center justify-center opacity-50">
                Select a command
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 overflow-auto">
            <h2 className="font-semibold mb-2">
                {command.command_type}
            </h2>

            <p>Status: <b>{command.status}</b></p>

            <pre className="mt-4 bg-muted p-3 rounded text-xs">
        {JSON.stringify(command.result, null, 2)}
      </pre>
        </div>
    );
}
