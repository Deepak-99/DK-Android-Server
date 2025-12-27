import CallRecordingPlayer from "./CallRecordingPlayer";

export default function CallDetail({ call }: { call: any }) {
    if (!call) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a call
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 space-y-4">
            <h2 className="text-lg font-bold">
                {call.contact_name || call.phone_number}
            </h2>

            <div className="text-sm text-muted-foreground">
                {call.type} • {call.duration}s • SIM {call.sim_slot ?? "-"}
            </div>

            {call.has_recording && (
                <CallRecordingPlayer src={`/calls/recording/${call.id}`} />
            )}
        </div>
    );
}
