const express = require('express');
const router = express.Router();
const { Location } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all locations for a device
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { device_id } = req.query;
    if (!device_id) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const locations = await Location.findAll({
      where: { device_id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Add a new location
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { device_id, latitude, longitude, accuracy, altitude, speed, heading, timestamp } = req.body;
    
    if (!device_id || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const location = await Location.create({
      device_id,
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      timestamp: timestamp || new Date()
    });
    
    res.status(201).json(location);
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Failed to save location' });
  }
});

// Get latest location for a device
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const { device_id } = req.query;
    if (!device_id) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const location = await Location.findOne({
      where: { device_id },
      order: [['timestamp', 'DESC']]
    });
    
    if (!location) {
      return res.status(404).json({ error: 'No location data found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error fetching latest location:', error);
    res.status(500).json({ error: 'Failed to fetch latest location' });
  }
});

module.exports = router;
