// services/deviceFileAgent.js
const wsClient = require("./wsClient");

module.exports = {
    async list(deviceId, path) {
        return wsClient.sendAndWait(deviceId, { type: "FILE_LIST", path });
    },

    async mkdir(deviceId, path, name) {
        return wsClient.sendAndWait(deviceId, { type: "FILE_MKDIR", path, name });
    },

    async remove(deviceId, path) {
        return wsClient.sendAndWait(deviceId, { type: "FILE_DELETE", path });
    },

    async upload(deviceId, path, file) {
        return wsClient.sendAndWait(deviceId, {
            type: "FILE_UPLOAD",
            path,
            name: file.originalname,
            data: file.buffer.toString("base64")
        });
    },

    async download(deviceId, path) {
        const result = await wsClient.sendAndWait(deviceId, {
            type: "FILE_DOWNLOAD",
            path
        });

        return {
            buffer: Buffer.from(result.data, "base64"),
            fileName: result.name,
            mimeType: result.mimeType
        };
    }
};
