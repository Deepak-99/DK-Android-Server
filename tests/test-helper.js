const { sequelize, clearDatabase } = require('../config/database');
const { User, Device } = require('../models');
const config = require('./test-config');

/**
 * Initialize test database with sample data
 */
async function initTestDatabase() {
  try {
    // Clear existing data
    await clearDatabase();
    
    // Create test users
    const testUser = await User.create({
      name: 'Test User',
      email: config.testUser.email,
      password: config.testUser.password,
      role: config.testUser.role,
      isActive: true
    });
    
    const adminUser = await User.create({
      name: 'Admin User',
      email: config.testAdmin.email,
      password: config.testAdmin.password,
      role: 'admin',
      isActive: true
    });
    
    // Create test devices
    const testDevice = await Device.create({
      deviceId: config.testDevice.id,
      name: 'Test Device',
      model: config.testDevice.model,
      osVersion: '13.0',
      userId: testUser.id,
      isOnline: true
    });
    
    return {
      testUser,
      adminUser,
      testDevice
    };
  } catch (error) {
    console.error('Error initializing test database:', error);
    throw error;
  }
}

/**
 * Get authentication headers for API requests
 * @param {Object} user - User object with id and role
 * @returns {Object} Headers with authentication token
 */
function getAuthHeaders(user) {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  try {
    await clearDatabase();
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

module.exports = {
  initTestDatabase,
  getAuthHeaders,
  cleanupTestData
};
