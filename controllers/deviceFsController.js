// controllers/deviceFsController.js
const fileAgent = require("../services/deviceFileAgent");

module.exports = {
    async list(req, res) {
        try {
            const { deviceId } = req.params;
            const path = req.query.path || "/";

            const data = await fileAgent.list(deviceId, path);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async mkdir(req, res) {
        try {
            const { deviceId } = req.params;
            const { path, name } = req.body;

            await fileAgent.mkdir(deviceId, path, name);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async remove(req, res) {
        try {
            const { deviceId } = req.params;
            const { path } = req.query;

            await fileAgent.remove(deviceId, path);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async upload(req, res) {
        try {
            const { deviceId } = req.params;
            const { path } = req.body;
            const file = req.file;

            await fileAgent.upload(deviceId, path, file);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async download(req, res) {
        try {
            const { deviceId } = req.params;
            const { path } = req.query;

            const { buffer, fileName, mimeType } = await fileAgent.download(deviceId, path);

            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            res.setHeader("Content-Type", mimeType);
            res.send(buffer);
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};
