const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class StreamHub {

    constructor() {
        /**
         * deviceId => {
         *   viewers: Set<socketId>,
         *   ffmpeg: ChildProcess | null,
         *   recording: boolean,
         *   startedAt: number
         * }
         */
        this.devices = new Map();
    }

    ensure(deviceId) {
        if (!this.devices.has(deviceId)) {
            this.devices.set(deviceId, {
                viewers: new Set(),
                ffmpeg: null,
                recording: false,
                startedAt: null
            });
        }
        return this.devices.get(deviceId);
    }

    /* ----------------------------------------------------
     * LIVE FRAME INGESTION (from Android)
     * --------------------------------------------------*/
    pushFrame({ deviceId, frameBase64, io }) {

        const device = this.ensure(deviceId);
        const frameBuffer = Buffer.from(frameBase64, "base64");

        // 🔴 1. Broadcast to viewers
        io.to(`screen:${deviceId}`).emit("screen_frame", {
            deviceId,
            frame: frameBase64,
            ts: Date.now()
        });

        // 🔴 2. Pipe into ffmpeg if recording
        if (device.recording && device.ffmpeg) {
            device.ffmpeg.stdin.write(frameBuffer);
        }
    }

    /* ----------------------------------------------------
     * START RECORDING
     * --------------------------------------------------*/
    startRecording(deviceId, options = {}) {

        const device = this.ensure(deviceId);
        if (device.recording) return;

        const dir = path.join("recordings", deviceId);
        fs.mkdirSync(dir, { recursive: true });

        const outputFile = path.join(
            dir,
            `screen_${Date.now()}.mp4`
        );

        const ffmpeg = spawn("ffmpeg", [
            "-y",
            "-f", "image2pipe",
            "-r", options.fps || "10",
            "-i", "-",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            outputFile
        ]);

        ffmpeg.on("exit", () => {
            device.ffmpeg = null;
            device.recording = false;
        });

        device.ffmpeg = ffmpeg;
        device.recording = true;
        device.startedAt = Date.now();

        return outputFile;
    }

    /* ----------------------------------------------------
     * STOP RECORDING
     * --------------------------------------------------*/
    stopRecording(deviceId) {

        const device = this.ensure(deviceId);
        if (!device.recording || !device.ffmpeg) return;

        device.ffmpeg.stdin.end();
        device.ffmpeg.kill("SIGINT");

        device.recording = false;
        device.ffmpeg = null;
    }

    /* ----------------------------------------------------
     * VIEWER MANAGEMENT
     * --------------------------------------------------*/
    addViewer(deviceId, socketId) {
        const device = this.ensure(deviceId);
        device.viewers.add(socketId);
    }

    removeViewer(deviceId, socketId) {
        const device = this.ensure(deviceId);
        device.viewers.delete(socketId);
    }

    /* ----------------------------------------------------
     * CLEANUP DEVICE
     * --------------------------------------------------*/
    shutdown(deviceId) {
        const device = this.ensure(deviceId);
        if (device.recording) this.stopRecording(deviceId);
        device.viewers.clear();
        this.devices.delete(deviceId);
    }
}

module.exports = new StreamHub();
