export interface CallLog {
    id: number;
    device_id: string;
    phone_number: string;
    name?: string | null;
    type: "incoming" | "outgoing" | "missed" | "rejected" | "blocked";
    duration: number;
    timestamp: number;
    created_at: string;
}
