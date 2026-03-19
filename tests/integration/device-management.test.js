const request = require('supertest');
const app = require('../../server');
const { User, Device } = require('../../models');
const { hashPassword } = require('../../utils/auth');
const { testUser, testDevice } = require('../test-config');

describe('Device Management Integration Test', () => {
  let adminToken;
  let userToken;
  let testAdminId;
  let testUserId;
  let testDeviceId;
  
  // Test data
  const adminData = {
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'adminPassword123',
    role: 'admin',
    isActive: true
  };
  
  const userData = {
    name: 'Test User',
    email: 'user@example.com',
    password: 'userPassword123',
    role: 'user',
    isActive: true
  };
  
  const deviceData = {
    deviceId: 'test-device-001',
    name: 'Test Device',
    model: 'Test Model',
    osVersion: '10.0.0',
    isOnline: true,
    lastSeen: new Date()
  };
  
  beforeAll(async () => {
    // Clear the test database
    await User.destroy({ where: {}, truncate: { cascade: true }, force: true });
    await Device.destroy({ where: {}, truncate: { cascade: true }, force: true });
    
    // Create test admin user
    const adminUser = await User.create({
      ...adminData,
      password: await hashPassword(adminData.password)
    });
    testAdminId = adminUser.id;
    
    // Create test regular user
    const regularUser = await User.create({
      ...userData,
      password: await hashPassword(userData.password)
    });
    testUserId = regularUser.id;
    
    // Create a test device
    const device = await Device.create({
      ...deviceData,
      userId: testUserId
    });
    testDeviceId = device.id;
    
    // Login as admin to get token
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminData.email,
        password: adminData.password
      });
    adminToken = adminLogin.body.token;
    
    // Login as regular user to get token
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });
    userToken = userLogin.body.token;
  });
  
  afterAll(async () => {
    // Clean up test data
    await User.destroy({ where: {}, truncate: { cascade: true }, force: true });
    await Device.destroy({ where: {}, truncate: { cascade: true }, force: true });
  });
  
  describe('Device Registration', () => {
    it('should allow admin to register a new device', async () => {
      const newDevice = {
        deviceId: 'new-device-001',
        name: 'New Test Device',
        model: 'Test Model X',
        osVersion: '11.0.0',
        userId: testUserId
      };
      
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newDevice);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.deviceId).toBe(newDevice.deviceId);
      expect(response.body.data.userId).toBe(testUserId.toString());
      
      // Verify the device was saved in the database
      const savedDevice = await Device.findByPk(response.body.data.id);
      expect(savedDevice).not.toBeNull();
      expect(savedDevice.deviceId).toBe(newDevice.deviceId);
    });
    
    it('should not allow regular user to register a device', async () => {
      const newDevice = {
        deviceId: 'user-device-001',
        name: 'User Test Device',
        model: 'Test Model Y',
        osVersion: '11.0.0'
      };
      
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newDevice);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Access denied');
    });
    
    it('should validate device data before registration', async () => {
      const invalidDevice = {
        // Missing required fields
        name: 'Incomplete Device'
      };
      
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDevice);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });
  
  describe('Device Retrieval', () => {
    it('should allow admin to get all devices', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
    
    it('should allow users to get their own devices', async () => {
      const response = await request(app)
        .get('/api/devices/my-devices')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verify all returned devices belong to the user
      const allBelongToUser = response.body.data.every(
        device => device.userId === testUserId.toString()
      );
      expect(allBelongToUser).toBe(true);
    });
    
    it('should allow users to get a specific device they own', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testDeviceId.toString());
      expect(response.body.data.userId).toBe(testUserId.toString());
    });
    
    it('should not allow users to get devices they do not own', async () => {
      // Create another user's device
      const otherUserDevice = await Device.create({
        deviceId: 'other-user-device',
        name: 'Other User Device',
        model: 'Other Model',
        osVersion: '10.0.0',
        userId: testAdminId // Different user
      });
      
      const response = await request(app)
        .get(`/api/devices/${otherUserDevice.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Not authorized');
    });
  });
  
  describe('Device Updates', () => {
    it('should allow admin to update any device', async () => {
      const updates = {
        name: 'Updated Device Name',
        isOnline: false
      };
      
      const response = await request(app)
        .put(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', updates.name);
      expect(response.body.data).toHaveProperty('isOnline', updates.isOnline);
      
      // Verify the device was updated in the database
      const updatedDevice = await Device.findByPk(testDeviceId);
      expect(updatedDevice.name).toBe(updates.name);
      expect(updatedDevice.isOnline).toBe(updates.isOnline);
    });
    
    it('should allow users to update their own devices', async () => {
      const updates = {
        name: 'User Updated Name',
        model: 'Updated Model'
      };
      
      const response = await request(app)
        .put(`/api/devices/${testDeviceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', updates.name);
      expect(response.body.data).toHaveProperty('model', updates.model);
    });
    
    it('should not allow users to update devices they do not own', async () => {
      // Create another user's device
      const otherUserDevice = await Device.create({
        deviceId: 'other-user-device-2',
        name: 'Other User Device 2',
        model: 'Other Model',
        osVersion: '10.0.0',
        userId: testAdminId // Different user
      });
      
      const updates = {
        name: 'Unauthorized Update'
      };
      
      const response = await request(app)
        .put(`/api/devices/${otherUserDevice.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Not authorized');
    });
  });
  
  describe('Device Deletion', () => {
    let deviceToDelete;
    
    beforeEach(async () => {
      // Create a device to delete in each test
      deviceToDelete = await Device.create({
        deviceId: `device-to-delete-${Date.now()}`,
        name: 'Device to Delete',
        model: 'Test Model',
        osVersion: '10.0.0',
        userId: testUserId
      });
    });
    
    it('should allow admin to delete any device', async () => {
      const response = await request(app)
        .delete(`/api/devices/${deviceToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Device deleted successfully');
      
      // Verify the device was deleted from the database
      const deletedDevice = await Device.findByPk(deviceToDelete.id);
      expect(deletedDevice).toBeNull();
    });
    
    it('should allow users to delete their own devices', async () => {
      const response = await request(app)
        .delete(`/api/devices/${deviceToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify the device was deleted from the database
      const deletedDevice = await Device.findByPk(deviceToDelete.id);
      expect(deletedDevice).toBeNull();
    });
    
    it('should not allow users to delete devices they do not own', async () => {
      // Create another user's device
      const otherUserDevice = await Device.create({
        deviceId: 'other-user-device-3',
        name: 'Other User Device 3',
        model: 'Other Model',
        osVersion: '10.0.0',
        userId: testAdminId // Different user
      });
      
      const response = await request(app)
        .delete(`/api/devices/${otherUserDevice.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Not authorized');
      
      // Verify the device was not deleted
      const notDeletedDevice = await Device.findByPk(otherUserDevice.id);
      expect(notDeletedDevice).not.toBeNull();
    });
  });
  
  describe('Device Search and Filtering', () => {
    beforeAll(async () => {
      // Create some test devices for search/filter tests
      await Device.bulkCreate([
        {
          deviceId: 'search-device-1',
          name: 'Search Test Device 1',
          model: 'Model A',
          osVersion: '10.0.0',
          isOnline: true,
          userId: testUserId
        },
        {
          deviceId: 'search-device-2',
          name: 'Search Test Device 2',
          model: 'Model B',
          osVersion: '11.0.0',
          isOnline: false,
          userId: testUserId
        },
        {
          deviceId: 'search-device-3',
          name: 'Another Device',
          model: 'Model A',
          osVersion: '12.0.0',
          isOnline: true,
          userId: testAdminId
        }
      ]);
    });
    
    it('should filter devices by online status', async () => {
      const response = await request(app)
        .get('/api/devices?isOnline=true')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify all returned devices are online
      const allOnline = response.body.data.every(device => device.isOnline === true);
      expect(allOnline).toBe(true);
    });
    
    it('should search devices by name or device ID', async () => {
      const searchTerm = 'Search Test';
      
      const response = await request(app)
        .get(`/api/devices?search=${searchTerm}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify all returned devices match the search term
      const allMatchSearch = response.body.data.every(device => 
        device.name.includes(searchTerm) || 
        device.deviceId.includes(searchTerm)
      );
      expect(allMatchSearch).toBe(true);
    });
    
    it('should filter devices by model', async () => {
      const model = 'Model A';
      
      const response = await request(app)
        .get(`/api/devices?model=${model}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify all returned devices match the model filter
      const allMatchModel = response.body.data.every(device => 
        device.model === model
      );
      expect(allMatchModel).toBe(true);
    });
    
    it('should combine multiple filters', async () => {
      const model = 'Model A';
      const isOnline = true;
      
      const response = await request(app)
        .get(`/api/devices?model=${model}&isOnline=${isOnline}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify all returned devices match all filters
      const allMatchFilters = response.body.data.every(device => 
        device.model === model && 
        device.isOnline === isOnline
      );
      expect(allMatchFilters).toBe(true);
    });
  });
});
