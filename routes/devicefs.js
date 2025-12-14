// routes/devicefs.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const fsController = require("../controllers/deviceFsController");

const router = express.Router({ mergeParams: true });

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../temp_uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Use disk storage (NON-BLOCKING)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) =>
        cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + "-" + file.originalname),
});

const upload = multer({ storage });

// --------------------- ROUTES ---------------------

// List directory
router.get("/", authenticateToken, requireAdmin, fsController.list);

// Create directory
router.post("/mkdir", authenticateToken, requireAdmin, fsController.mkdir);

// Delete file/folder
router.delete("/", authenticateToken, requireAdmin, fsController.remove);

// Upload file to device
router.post("/upload", authenticateToken, requireAdmin, upload.single("file"), fsController.upload);

// Download file from device
router.get("/download", authenticateToken, requireAdmin, fsController.download);

module.exports = router;
