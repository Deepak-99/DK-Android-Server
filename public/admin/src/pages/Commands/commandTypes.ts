export type CommandStatus =
    | "pending"
    | "in_progress"
    | "completed"
    | "failed"
    | "timed_out";

export interface Command {
    id: number;
    device_id: string;
    command_type: string;
    parameters: Record<string, any>;
    status: CommandStatus;
    result?: any;
    created_at: string;
    updated_at: string;
}
