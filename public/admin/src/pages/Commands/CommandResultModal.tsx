import { Dialog } from "@mui/material";

interface Props {
    open: boolean;
    result: any;
    onClose: () => void;
}

export default function CommandResultModal({
                                               open,
                                               result,
                                               onClose
                                           }: Props) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>

            <div className="bg-card text-text p-5 space-y-3">

                <h3 className="text-lg font-semibold">
                    Command Result
                </h3>

                <div className="text-sm text-muted">
                    Command: {result?.command}
                </div>

                <pre className="bg-bg p-3 rounded-lg text-xs overflow-auto">
          {JSON.stringify(result?.data, null, 2)}
        </pre>

                <button
                    onClick={onClose}
                    className="bg-accent px-4 py-2 rounded-lg"
                >
                    Close
                </button>

            </div>

        </Dialog>
    );
}