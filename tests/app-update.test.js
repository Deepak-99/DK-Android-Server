const request = require('supertest');
const app = require('../app');
const { AppUpdate } = require('../models');
const fs = require('fs-extra');
const path = require('path');
const jwt = require('jsonwebtoken');

// Test configuration
const config = global.testConfig || require('./test-config');

// Test data
const TEST_APK_PATH = path.join(__dirname, 'fixtures', 'test-app.apk');
const TEST_UPLOAD_DIR = config.uploads.dir;

// Helper function to generate a test JWT token
const generateTestToken = (userId = 1, role = 'admin') => {
  return jwt.sign(
    { userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Helper function to clean up test files
const cleanUpTestFiles = async () => {
  try {
    if (fs.existsSync(TEST_UPLOAD_DIR)) {
      await fs.emptyDir(TEST_UPLOAD_DIR);
    }
  } catch (error) {
    console.error('Error cleaning up test files:', error);
  }
};

describe('App Update API', () => {
  let adminToken;
  let testUpdate;

  beforeAll(async () => {
    // Setup test environment
    await cleanUpTestFiles();
    
    // Generate test token
    adminToken = generateTestToken(
      config.testUser.id,
      config.testUser.role
    );
    
    // Ensure test APK file exists
    if (!fs.existsSync(TEST_APK_PATH)) {
      await fs.writeFile(TEST_APK_PATH, 'test apk content');
    }
    
    // Clear any existing test data
    await AppUpdate.destroy({ where: {}, truncate: true, force: true });
  });

  afterAll(async () => {
    // Cleanup
    try {
      await cleanUpTestFiles();
      await AppUpdate.destroy({ where: {}, truncate: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
  
  beforeEach(async () => {
    // Clean up before each test
    await cleanUpTestFiles();
    await AppUpdate.destroy({ where: {}, truncate: true, force: true });
  });

  describe('POST /api/v2/app-updates', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v2/app-updates')
        .field('version', '1.0.0')
        .field('version_code', '100')
        .field('channel', 'stable')
        .field('is_required', 'true')
        .attach('apk', TEST_APK_PATH);

      expect(response.status).toBe(401);
    });
    
    it('should upload a new app version', async () => {
      const response = await request(app)
        .post('/api/v2/app-updates')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('version', '1.0.0')
        .field('version_code', '100')
        .field('channel', 'stable')
        .field('is_required', 'true')
        .field('release_notes', 'Test release')
        .field('whats_new', JSON.stringify(['New feature', 'Bug fixes']))
        .field('min_sdk_version', '21')
        .field('rollout_percentage', '50')
        .attach('apk', TEST_APK_PATH);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.version_code).toBe(100);
      expect(response.body.channel).toBe('stable');
      expect(response.body.is_required).toBe(true);
      expect(response.body.rollout_percentage).toBe(50);
      
      // Verify file was uploaded
      const filePath = path.join(TEST_UPLOAD_DIR, response.body.file_name);
      expect(fs.existsSync(filePath)).toBe(true);
      
      // Save for later tests
      testUpdate = response.body;
    });
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v2/app-updates')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('apk', TEST_APK_PATH);
        
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Version is required',
          param: 'version',
          location: 'body'
        })
      );
    });
  });

  describe('GET /api/v2/app-updates', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v2/app-updates');
      expect(response.status).toBe(401);
    });
    
    it('should list all app updates', async () => {
      // First create a test update
      await AppUpdate.create({
        id: 'test-id-123',
        version: '1.0.0',
        version_code: 100,
        channel: 'stable',
        file_path: '/test/path',
        file_name: 'test.apk',
        file_size: 1024,
        checksum: 'test-checksum',
        is_required: true,
        min_sdk_version: 21,
        is_active: true,
        release_notes: 'Test release'
      });

      const response = await request(app)
        .get('/api/v2/app-updates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toMatchObject({
        version: '1.0.0',
        version_code: 100,
        channel: 'stable',
        is_active: true
      });
    });
    
    it('should filter by channel', async () => {
      // Create test updates
      await AppUpdate.bulkCreate([
        {
          id: 'test-stable-1',
          version: '1.0.0',
          version_code: 100,
          channel: 'stable',
          file_path: '/test/path1',
          file_name: 'test1.apk',
          file_size: 1024,
          checksum: 'test-checksum-1',
          is_active: true
        },
        {
          id: 'test-beta-1',
          version: '1.1.0-beta',
          version_code: 110,
          channel: 'beta',
          file_path: '/test/path2',
          file_name: 'test2.apk',
          file_size: 1024,
          checksum: 'test-checksum-2',
          is_active: true
        }
      ]);
      
      const response = await request(app)
        .get('/api/v2/app-updates?channel=beta')
        .set('Authorization', `Bearer ${adminToken}`);
        
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].channel).toBe('beta');
    });
  });

  describe('POST /api/v2/app-updates/check', () => {
    beforeEach(async () => {
      // Create a test update
      testUpdate = await AppUpdate.create({
        id: 'test-update-123',
        version: '1.0.0',
        version_code: 100,
        channel: 'stable',
        file_path: '/test/path',
        file_name: 'test.apk',
        file_size: 1024,
        checksum: 'test-checksum',
        is_required: true,
        min_sdk_version: 21,
        is_active: true,
        rollout_percentage: 100,
        device_models: [],
        android_versions: [13],
        release_notes: 'Test release'
      });
    });
    
    it('should check for available updates', async () => {
      const response = await request(app)
        .post('/api/v2/app-updates/check')
        .send({
          device_id: 'test-device-123',
          version_code: 90,
          channel: 'stable',
          device_model: 'Pixel 6',
          android_version: 13
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        update_available: true,
        latest_version: '1.0.0',
        version_code: 100,
        is_required: true
      });
      expect(response.body.download_url).toContain('/api/v2/app-updates/test-update-123/download');
    });
    
    it('should respect rollout percentage', async () => {
      // Set rollout to 0% for this test
      await testUpdate.update({ rollout_percentage: 0 });
      
      const response = await request(app)
        .post('/api/v2/app-updates/check')
        .send({
          device_id: 'test-device-123',
          version_code: 90,
          channel: 'stable',
          device_model: 'Pixel 6',
          android_version: 13
        });

      expect(response.status).toBe(200);
      expect(response.body.update_available).toBe(false);
    });
    
    it('should handle device targeting', async () => {
      // Update to only target specific device
      await testUpdate.update({ 
        device_models: ['Pixel 6', 'Pixel 7'],
        android_versions: [13, 14]
      });
      
      // Test with matching device
      const response1 = await request(app)
        .post('/api/v2/app-updates/check')
        .send({
          device_id: 'test-device-123',
          version_code: 90,
          channel: 'stable',
          device_model: 'Pixel 6',
          android_version: 13
        });
      expect(response1.status).toBe(200);
      expect(response1.body.update_available).toBe(true);
      
      // Test with non-matching device
      const response2 = await request(app)
        .post('/api/v2/app-updates/check')
        .send({
          device_id: 'test-device-456',
          version_code: 90,
          channel: 'stable',
          device_model: 'Samsung Galaxy',
          android_version: 13
        });
      expect(response2.status).toBe(200);
      expect(response2.body.update_available).toBe(false);
    });
  });

  describe('POST /api/v2/app-updates/:id/report', () => {
    beforeEach(async () => {
      // Create a test update
      testUpdate = await AppUpdate.create({
        id: 'test-update-456',
        version: '1.0.0',
        version_code: 100,
        channel: 'stable',
        file_path: '/test/path',
        file_name: 'test.apk',
        file_size: 1024,
        checksum: 'test-checksum',
        is_required: true,
        min_sdk_version: 21,
        is_active: true
      });
    });
    
    it('should report successful installation', async () => {
      const response = await request(app)
        .post(`/api/v2/app-updates/${testUpdate.id}/report`)
        .send({
          device_id: 'test-device-123',
          success: true,
          error: null
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify the update was recorded
      const updated = await AppUpdate.findByPk(testUpdate.id);
      expect(updated.installed_count).toBe(1);
      expect(updated.failed_count).toBe(0);
    });
    
    it('should report failed installation', async () => {
      const response = await request(app)
        .post(`/api/v2/app-updates/${testUpdate.id}/report`)
        .send({
          device_id: 'test-device-123',
          success: false,
          error: 'Installation failed: Unknown error'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify the failure was recorded
      const updated = await AppUpdate.findByPk(testUpdate.id);
      expect(updated.installed_count).toBe(0);
      expect(updated.failed_count).toBe(1);
    });
    
    it('should return 404 for non-existent update', async () => {
      const response = await request(app)
        .post('/api/v2/app-updates/non-existent-id/report')
        .send({
          device_id: 'test-device-123',
          success: true,
          error: null
        });
        
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v2/app-updates/:id', () => {
    beforeEach(async () => {
      // Create a test update
      testUpdate = await AppUpdate.create({
        id: 'test-update-789',
        version: '1.0.0',
        version_code: 100,
        channel: 'stable',
        file_path: '/test/path',
        file_name: 'test.apk',
        file_size: 1024,
        checksum: 'test-checksum',
        is_required: true,
        min_sdk_version: 21,
        is_active: true
      });
    });
    
    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/v2/app-updates/${testUpdate.id}`);
        
      expect(response.status).toBe(401);
    });
    
    it('should delete an app update', async () => {
      const response = await request(app)
        .delete(`/api/v2/app-updates/${testUpdate.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify the update was soft-deleted
      const deleted = await AppUpdate.findByPk(testUpdate.id, { paranoid: false });
      expect(deleted).toBeTruthy();
      expect(deleted.deletedAt).toBeTruthy();
    });
    
    it('should return 404 for non-existent update', async () => {
      const response = await request(app)
        .delete('/api/v2/app-updates/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);
        
      expect(response.status).toBe(404);
    });
  });
});
