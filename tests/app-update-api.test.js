const request = require('supertest');
const { Sequelize } = require('sequelize');
const app = require('../app');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Create a test database
const testDb = new Sequelize('sqlite::memory:', {
  logging: false
});

// Mock models
jest.mock('../models', () => {
  const { DataTypes } = require('sequelize');
  
  const AppUpdate = testDb.define('AppUpdate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    version: DataTypes.STRING,
    version_code: DataTypes.INTEGER,
    file_path: DataTypes.STRING,
    file_name: DataTypes.STRING,
    file_size: DataTypes.INTEGER,
    checksum: DataTypes.STRING,
    is_required: DataTypes.BOOLEAN,
    is_active: DataTypes.BOOLEAN,
    release_notes: DataTypes.TEXT,
    rollout_percentage: DataTypes.INTEGER,
    min_sdk_version: DataTypes.INTEGER,
    channel: DataTypes.STRING,
    supported_devices: DataTypes.JSON,
    install_success_count: DataTypes.INTEGER,
    install_failure_count: DataTypes.INTEGER,
    download_count: DataTypes.INTEGER
  }, {
    tableName: 'app_updates',
    timestamps: true,
    paranoid: true,
    underscored: true
  });

  return { AppUpdate };
});

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret, callback) => {
    if (token === 'valid.token.here') {
      callback(null, { 
        id: 'test-user-id',
        isAdmin: true,
        deviceId: 'test-device-id'
      });
    } else {
      callback(new Error('Invalid token'));
    }
  })
}));

// Mock file system
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined)
  },
  existsSync: jest.fn().mockReturnValue(true)
}));

// Mock multer
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        originalname: 'test-app.apk',
        path: '/test/path/test-app.apk',
        size: 1024
      };
      next();
    }
  });
  multer.diskStorage = () => jest.fn();
  return multer;
});

// Mock app update controller
const { AppUpdate } = require('../models');

// Test data
const testAppUpdate = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  version: '1.0.0',
  version_code: 100,
  file_path: '/test/path',
  file_name: 'test-app.apk',
  file_size: 1024,
  checksum: 'test-checksum',
  is_required: true,
  is_active: true,
  release_notes: 'Test release',
  rollout_percentage: 100,
  min_sdk_version: 21,
  channel: 'stable',
  supported_devices: ['test-device'],
  install_success_count: 0,
  install_failure_count: 0,
  download_count: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('AppUpdate API', () => {
  beforeAll(async () => {
    // Sync the test database
    await testDb.sync({ force: true });
  });

  afterEach(async () => {
    // Clear all mocks after each test
    jest.clearAllMocks();
    // Clear the test database
    await AppUpdate.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    // Close the test database connection
    await testDb.close();
  });

  describe('POST /api/app-update/upload', () => {
    it('should upload a new app update', async () => {
      AppUpdate.create = jest.fn().mockResolvedValue(testAppUpdate);
      
      const response = await request(app)
        .post('/api/app-update/upload')
        .set('Authorization', 'Bearer valid.token.here')
        .field('version', '1.0.0')
        .field('version_code', '100')
        .field('is_required', 'true')
        .field('release_notes', 'Test release')
        .attach('file', 'test/fixtures/test-app.apk');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.version).toBe('1.0.0');
    });

    it('should return 400 for invalid version format', async () => {
      const response = await request(app)
        .post('/api/app-update/upload')
        .set('Authorization', 'Bearer valid.token.here')
        .field('version', 'invalid-version')
        .field('version_code', '100')
        .attach('file', 'test/fixtures/test-app.apk');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/app-update/check', () => {
    it('should return the latest update for a device', async () => {
      AppUpdate.findOne = jest.fn().mockResolvedValue(testAppUpdate);
      
      const response = await request(app)
        .get('/api/app-update/check')
        .query({
          current_version: '0.9.0',
          current_version_code: 90,
          device_id: 'test-device-id'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('update_available', true);
      expect(response.body.latest_version).toBe('1.0.0');
    });

    it('should return 404 if no update is available', async () => {
      AppUpdate.findOne = jest.fn().mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/app-update/check')
        .query({
          current_version: '2.0.0',
          current_version_code: 200,
          device_id: 'test-device-id'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/app-update/:id/install-report', () => {
    it('should record a successful installation', async () => {
      const update = { ...testAppUpdate, increment: jest.fn() };
      AppUpdate.findByPk = jest.fn().mockResolvedValue(update);
      
      const response = await request(app)
        .post(`/api/app-update/${testAppUpdate.id}/install-report`)
        .set('Authorization', 'Bearer valid.token.here')
        .send({
          success: true,
          device_id: 'test-device-id',
          error_message: null
        });

      expect(response.status).toBe(200);
      expect(update.increment).toHaveBeenCalledWith('install_success_count', { by: 1 });
    });
  });
});
