// config/default.js
const path = require('path');
const os = require('os');

module.exports = {
    // ... other configs ...

    // File upload settings
    uploadDir: path.join(process.cwd(), 'uploads'),
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: {
        audio: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg'],
        video: ['video/mp4', 'video/webm', 'video/quicktime'],
        image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    },

    // File retention in days
    retention: {
        callRecordings: 30,
        screenRecordings: 30,
        screenshots: 14,
        thumbnails: 14
    }
};