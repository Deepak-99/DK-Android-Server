const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const { User } = require('../../models');
const { testUser } = require('../test-config');
const { getAuthHeaders } = require('../test-utils');

describe('Authentication Middleware', () => {
  let user;
  let validToken;
  
  beforeAll(async () => {
    // Create a test user
    user = await User.create({
      name: 'Test User',
      email: testUser.email,
      password: 'password123',
      role: 'user',
      isActive: true
    });
    
    // Generate a valid token
    validToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });
  
  afterAll(async () => {
    // Clean up the test user
    if (user) {
      await user.destroy({ force: true });
    }
  });
  
  describe('JWT Authentication', () => {
    it('should allow access with a valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', user.id);
      expect(response.body.data).toHaveProperty('email', user.email);
    });
    
    it('should deny access without a token', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });
    
    it('should deny access with an invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
    
    it('should deny access with an expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Expired 1 second ago
      );
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/expired/);
    });
  });
  
  describe('Role-Based Access Control', () => {
    it('should allow admin to access admin routes', async () => {
      // Create an admin user
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      
      const adminToken = jwt.sign(
        { userId: admin.id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Clean up
      await admin.destroy({ force: true });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
    
    it('should deny non-admin access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });
});
