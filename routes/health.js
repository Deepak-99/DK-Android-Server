// routes/health.js
const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected', time: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

router.get('/status', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    time: new Date()
  });
});

module.exports = router;
