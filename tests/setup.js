// Load environment variables
require('dotenv').config({ path: '.env.test' });
const path = require('path');
const fs = require('fs-extra');
const { sequelize } = require('../config/database');
const config = require('../tests/test-config');

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Use MySQL for testing
process.env.DB_DIALECT = config.db.dialect || 'mysql';
process.env.DB_NAME = config.db.database || 'hawkshaw_db';
process.env.DB_USER = config.db.username || 'root';
process.env.DB_PASSWORD = config.db.password || '';
process.env.DB_HOST = config.db.host || 'localhost';
process.env.DB_PORT = config.db.port || 3306;

// Set up global test database connection
beforeAll(async () => {
  try {
    // Ensure test directories exist
    const testDirs = [
      path.join(__dirname, 'fixtures'),
      path.join(__dirname, 'uploads'),
      path.join(__dirname, 'logs')
    ];

    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) {
        await fs.mkdirp(dir, { recursive: true });
      }
    }

    // Sync all models with force: true to create tables
    // Disable foreign key checks during sync to avoid constraint issues
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null, { raw: true });
    await sequelize.sync({ force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, { raw: true });
  } catch (error) {
    console.error('Test setup failed:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  // Close the database connection
  await sequelize.close();
});

afterAll(async () => {
  // Close the database connection after all tests
  if (sequelize) {
    await sequelize.close();
  }
  
  // Clean up test files
  await fs.remove(config.uploads.dir);
});

// Mock logger
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Set a longer timeout for tests
jest.setTimeout(30000);

// Global test configuration and utilities
global.testConfig = config;
global.sequelize = sequelize;
