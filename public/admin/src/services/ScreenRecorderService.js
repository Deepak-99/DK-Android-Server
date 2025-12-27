const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class ScreenRecorder {
    constructor(deviceId) {
        this.deviceId = deviceId;
        this.ffmpeg = null;
        this.active = false;
    }

    start() {
        if (this.active) return;

        const dir = this._ensureDir();
        const file = path.join(dir, this._filename());

        this.ffmpeg = spawn("ffmpeg", [
            "-f", "image2pipe",
            "-r", "10",
            "-i", "-",
            "-vcodec", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            file
        ]);

        this.active = true;
        this.outputFile = file;
    }

    writeFrame(buffer) {
        if (!this.active || !this.ffmpeg) return;
        this.ffmpeg.stdin.write(buffer);
    }

    stop() {
        if (!this.active) return;
        this.ffmpeg.stdin.end();
        this.ffmpeg.kill("SIGINT");
        this.active = false;
    }

    _ensureDir() {
        const d = new Date().toISOString().split("T")[0];
        const dir = path.join("recordings", this.deviceId, d);
        fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    _filename() {
        const t = new Date().toTimeString().slice(0, 8).replace(/:/g, "-");
        return `session_${t}.mp4`;
    }
}

module.exports = ScreenRecorder;
