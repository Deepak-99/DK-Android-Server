// routes/devicefs.js
const express = require("express");
const multer = require("multer");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const fsController = require("../controllers/deviceFsController");

const router = express.Router({ mergeParams: true });
const upload = multer();

// List directory
router.get("/", authenticateToken, requireAdmin, fsController.list);

// Create folder
router.post("/mkdir", authenticateToken, requireAdmin, fsController.mkdir);

// Delete file/folder
router.delete("/", authenticateToken, requireAdmin, fsController.remove);

// Upload file TO DEVICE
router.post("/upload", authenticateToken, requireAdmin, upload.single("file"), fsController.upload);

// Download file FROM DEVICE
router.get("/download", authenticateToken, requireAdmin, fsController.download);

module.exports = router;
