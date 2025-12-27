const sendInput = (deviceId, payload) => {
    Command.create({
        device_id: deviceId,
        command_type: "REMOTE_INPUT",
        parameters: payload,
        status: "pending"
    });
};
