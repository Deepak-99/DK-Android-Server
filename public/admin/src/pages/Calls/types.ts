export type CallType = "incoming" | "outgoing" | "missed";

export interface CallLog {
    id: number;
    device_id: string;
    phone_number: string;
    contact_name?: string;
    type: CallType;
    duration: number;
    timestamp: number;
    sim_slot?: number;
    has_recording?: boolean;
}
