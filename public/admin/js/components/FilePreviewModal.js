import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    FaTimes,
    FaExpand,
    FaCompress
} from "react-icons/fa";

export default function FilePreviewModal({ file, deviceId, onClose }) {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);

    const fullPath = file.fullPath;

    useEffect(() => {
        loadPreview();
    }, [file]);

    const loadPreview = async () => {
        try {
            setLoading(true);

            // API returns base64 content for preview
            const res = await axios.get(
                `/api/devices/${deviceId}/fs/download?path=${encodeURIComponent(fullPath)}`,
                { responseType: "arraybuffer" }
            );

            const mime = file.mimeType || guessMime(file.name);

            const blob = new Blob([res.data], { type: mime });
            const url = URL.createObjectURL(blob);

            setContent({ url, mime });
        } catch (err) {
            console.error("Preview load failed:", err);
            setContent({ error: "Preview not available" });
        } finally {
            setLoading(false);
        }
    };

    const guessMime = (name) => {
        const ext = name.toLowerCase().split(".").pop();
        switch (ext) {
            case "jpg":
            case "jpeg":
            case "png":
            case "webp":
                return "image/*";
            case "mp4":
            case "webm":
                return "video/*";
            case "mp3":
            case "wav":
                return "audio/*";
            case "pdf":
                return "application/pdf";
            case "txt":
            case "md":
            case "log":
            case "json":
                return "text/plain";
            default:
                return "application/octet-stream";
        }
    };

    const renderContent = () => {
        if (!content || loading) return <div className="loading">Loading Preview...</div>;
        if (content.error) return <div className="error">{content.error}</div>;

        const { url, mime } = content;

        if (mime.startsWith("image")) {
            return <img src={url} className="preview-image" />;
        }

        if (mime.startsWith("video")) {
            return <video src={url} className="preview-video" controls />;
        }

        if (mime.startsWith("audio")) {
            return <audio src={url} className="preview-audio" controls />;
        }

        if (mime === "application/pdf") {
            return (
                <iframe
                    src={url}
                    className="preview-pdf"
                    title="PDF Preview"
                    frameBorder="0"
                ></iframe>
            );
        }

        // Text and JSON
        if (mime.startsWith("text") || file.name.endsWith(".json")) {
            return (
                <pre className="preview-text">
          {new TextDecoder().decode(content.buffer)}
        </pre>
            );
        }

        return <div className="fallback">No preview available</div>;
    };

    return (
        <div className={`preview-overlay ${fullscreen ? "fullscreen" : ""}`}>
            <div className="preview-box">

                {/* Header */}
                <div className="preview-header">
                    <span className="file-name">{file.name}</span>

                    <div className="actions">
                        <button
                            className="icon-btn"
                            onClick={() => setFullscreen(!fullscreen)}
                        >
                            {fullscreen ? <FaCompress /> : <FaExpand />}
                        </button>

                        <button className="icon-btn close" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="preview-content">{renderContent()}</div>
            </div>

            <style>{`
        .preview-overlay {
          position: fixed;
          top:0;left:0;right:0;bottom:0;
          background: rgba(0,0,0,0.6);
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 20px;
          z-index: 9999;
        }

        .preview-overlay.fullscreen {
          padding: 0;
        }

        .preview-box {
          background: var(--bg);
          color: var(--text);
          border-radius: 10px;
          width: 80%;
          height: 80%;
          display:flex;
          flex-direction:column;
        }

        .preview-overlay.fullscreen .preview-box {
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .preview-header {
          display:flex;
          justify-content:space-between;
          padding: 10px;
          border-bottom: 1px solid var(--border);
        }

        .file-name {
          font-weight:bold;
        }

        .actions .icon-btn {
          margin-left: 8px;
          cursor:pointer;
          color: var(--text);
          background:none;
          border:none;
          font-size: 18px;
        }

        .icon-btn.close {
          color:#ff6b6b;
        }

        .preview-content {
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:auto;
          background: var(--bg2);
        }

        .preview-image {
          max-width:100%;
          max-height:100%;
          border-radius:6px;
        }

        .preview-video {
          max-width:100%;
          max-height:100%;
        }

        .preview-audio {
          width:90%;
        }

        .preview-pdf {
          width:100%;
          height:100%;
        }

        .preview-text {
          padding:20px;
          background: var(--bg);
          white-space: pre-wrap;
          word-break: break-word;
        }

        .fallback {
          color:#bbb;
        }

        [data-theme="dark"] {
          --bg:#202020;
          --bg2:#151515;
          --text:#eee;
          --border:#333;
        }
      `}</style>
        </div>
    );
}
