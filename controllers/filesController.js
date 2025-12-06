const fileAgent = require("../services/deviceFileAgent");
// You'll implement deviceFileAgent to talk to Android device

module.exports = {

    list: async (req, res) => {
        try {
            const { deviceId } = req.params;
            const path = req.query.path || "/storage/emulated/0";
            const result = await fileAgent.list(deviceId, path);
            res.json(result);
        } catch (e) {
            console.error("File list error:", e);
            res.status(500).json({ success: false, error: "Server error" });
        }
    },

    mkdir: async (req, res) => {
        try {
            const { deviceId } = req.params;
            const { path, name } = req.body;
            await fileAgent.mkdir(deviceId, path, name);
            res.json({ success: true });
        } catch (e) {
            console.error("mkdir error:", e);
            res.status(500).json({ success: false, error: "Server error" });
        }
    },

    delete: async (req, res) => {
        try {
            const { deviceId } = req.params;
            const path = req.query.path;
            await fileAgent.remove(deviceId, path);
            res.json({ success: true });
        } catch (e) {
            console.error("delete error:", e);
            res.status(500).json({ success: false, error: "Server error" });
        }
    },

    upload: async (req, res) => {
        try {
            const { deviceId } = req.body;
            const { path } = req.body;
            const file = req.file;

            await fileAgent.upload(deviceId, path, file);
            res.json({ success: true });
        } catch (e) {
            console.error("upload error:", e);
            res.status(500).json({ success: false, error: "Server error" });
        }
    },

    download: async (req, res) => {
        try {
            const { deviceId } = req.params;
            const path = req.query.path;

            const stream = await fileAgent.download(deviceId, path);
            stream.pipe(res);
        } catch (e) {
            console.error("download error:", e);
            res.status(500).json({ success: false, error: "Server error" });
        }
    }
};
