const express = require('express');
const router = express.Router();

const db = require('../models');
const { Location, Device } = db;

const { authenticateToken } = require('../middleware/auth');

/*
---------------------------------------------
Get locations
---------------------------------------------
*/
router.get('/', authenticateToken, async (req, res) => {

  try {

    const { device_id } = req.query;

    const device = await Device.findOne({
      where: { device_id }
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const locations = await Location.findAll({
      where: { device_id: device.id },
      order: [['created_at', 'DESC']]
    });

    res.json(locations);

  } catch (error) {

    res.status(500).json({
      error: 'Failed to fetch locations'
    });

  }

});

/*
---------------------------------------------
Add location
---------------------------------------------
*/
router.post('/', authenticateToken, async (req, res) => {

  try {

    const device = await Device.findOne({
      where: { device_id: req.body.device_id }
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const location = await Location.create({
      device_id: device.id,
      ...req.body
    });

    res.status(201).json(location);

  } catch (error) {

    res.status(500).json({
      error: 'Failed to save location'
    });

  }

});

module.exports = router;