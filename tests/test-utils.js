const jwt = require('jsonwebtoken');
const { User, Device } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Generate a test JWT token
 * @param {Object} user - User object
 * @param {string} [secret=process.env.JWT_SECRET] - JWT secret
 * @returns {string} JWT token
 */
const generateTestToken = (user, secret = process.env.JWT_SECRET) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

/**
 * Create a test user
 * @param {Object} [overrides] - User properties to override
 * @returns {Promise<Object>} Created user
 */
const createTestUser = async (overrides = {}) => {
  const defaults = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    role: 'user',
    isActive: true
  };
  
  const userData = { ...defaults, ...overrides };
  return await User.create(userData);
};

/**
 * Create a test device
 * @param {Object} [overrides] - Device properties to override
 * @returns {Promise<Object>} Created device
 */
const createTestDevice = async (overrides = {}) => {
  const defaults = {
    deviceId: `device-${Date.now()}`,
    name: 'Test Device',
    model: 'Test Model',
    osVersion: '1.0.0',
    isOnline: true
  };
  
  const deviceData = { ...defaults, ...overrides };
  return await Device.create(deviceData);
};

/**
 * Clean up test database
 * @returns {Promise<void>}
 */
const cleanDatabase = async () => {
  await sequelize.sync({ force: true });
};

/**
 * Get authenticated request headers
 * @param {Object} user - User object
 * @returns {Object} Headers with authorization
 */
const getAuthHeaders = (user) => ({
  'Authorization': `Bearer ${generateTestToken(user)}`,
  'Content-Type': 'application/json'
});

module.exports = {
  generateTestToken,
  createTestUser,
  createTestDevice,
  cleanDatabase,
  getAuthHeaders
};
