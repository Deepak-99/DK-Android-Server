// routes/health.js
const express = require('express');
const router = express.Router();

const db = require('../models');
const sequelize = db.sequelize;

router.get('/', async (req, res) => {

  try {

    await sequelize.authenticate();

    res.json({
      status: 'ok',
      db: 'connected',
      time: new Date(),
      uptime: process.uptime()
    });

  } catch (err) {

    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      error: err.message
    });

  }

});


router.get('/status', (req, res) => {

  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version,
    time: new Date()
  });

});

module.exports = router;