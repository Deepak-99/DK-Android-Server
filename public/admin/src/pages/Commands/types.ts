export type CommandStatus =
    | "pending"
    | "in_progress"
    | "completed"
    | "failed"
    | "timed_out";

export interface CommandItem {
    id: number;
    device_id: string;
    command_type: string;
    parameters: any;
    status: CommandStatus;
    result: any;
    created_at: string;
    updated_at: string;
}
