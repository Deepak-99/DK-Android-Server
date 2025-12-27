export type CommandType =
    | "reboot"
    | "lock_device"
    | "wipe_data"
    | "get_device_info"
    | "get_apps"
    | "get_contacts"
    | "get_sms"
    | "get_call_logs"
    | "get_location"
    | "take_photo"
    | "record_audio"
    | "record_video"
    | "execute_shell"
    | "send_sms"
    | "make_call"
    | "check_update"
    | "download_update"
    | "install_update"
    | "screenshot";

export interface CommandDTO {
    id: number;
    device_id: string;
    command_type: CommandType;
    parameters: any;
    status: "pending" | "in_progress" | "completed" | "failed" | "timed_out";
    result?: string;
    created_at: string;
}
