const request = require('supertest');
const app = require('../../server');
const { createTestUser, createTestDevice, getAuthHeaders, cleanDatabase } = require('../test-utils');

describe('Devices API', () => {
  let adminUser;
  let regularUser;
  let testDevice;
  let adminAuthHeaders;
  let userAuthHeaders;

  beforeAll(async () => {
    await cleanDatabase();
    
    // Create test users
    adminUser = await createTestUser({
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    regularUser = await createTestUser({
      email: 'user@example.com',
      password: 'user123',
      role: 'user'
    });

    // Create test device
    testDevice = await createTestDevice({
      deviceId: 'test-device-123',
      name: 'Test Device',
      userId: adminUser.id
    });

    // Get auth headers
    adminAuthHeaders = getAuthHeaders(adminUser);
    userAuthHeaders = getAuthHeaders(regularUser);
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/devices', () => {
    it('should return devices for admin user', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set(adminAuthHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('devices');
      expect(Array.isArray(response.body.data.devices)).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('total_count');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set(userAuthHeaders);

      expect(response.status).toBe(403);
    });

    it('should filter devices by search query', async () => {
      const response = await request(app)
        .get('/api/devices?search=Test')
        .set(adminAuthHeaders);

      expect(response.status).toBe(200);
      expect(response.body.data.devices.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/devices/:id', () => {
    it('should return device details for admin', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDevice.id}`)
        .set(adminAuthHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testDevice.id);
    });

    it('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .get('/api/devices/non-existent-id')
        .set(adminAuthHeaders);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/devices', () => {
    it('should create a new device', async () => {
      const newDevice = {
        deviceId: `new-device-${Date.now()}`,
        name: 'New Test Device',
        model: 'Test Model',
        osVersion: '1.0.0'
      };

      const response = await request(app)
        .post('/api/devices')
        .set(adminAuthHeaders)
        .send(newDevice);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        deviceId: newDevice.deviceId,
        name: newDevice.name,
        model: newDevice.model
      });
    });
  });

  describe('PUT /api/devices/:id', () => {
    it('should update device details', async () => {
      const updates = {
        name: 'Updated Device Name',
        model: 'Updated Model'
      };

      const response = await request(app)
        .put(`/api/devices/${testDevice.id}`)
        .set(adminAuthHeaders)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject(updates);
    });
  });

  describe('DELETE /api/devices/:id', () => {
    it('should delete a device', async () => {
      const deviceToDelete = await createTestDevice({
        deviceId: `device-to-delete-${Date.now()}`,
        name: 'Device to delete'
      });

      const response = await request(app)
        .delete(`/api/devices/${deviceToDelete.id}`)
        .set(adminAuthHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
