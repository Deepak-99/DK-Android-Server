const request = require('supertest');
const app = require('../test-app');

// Mock the JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementation((token, secret, callback) => {
    if (token === 'valid.token.here') {
      return { 
        id: 'test-user-id',
        isAdmin: true,
        deviceId: 'test-device-id'
      };
    }
    throw new Error('Invalid token');
  })
}));

describe('App API', () => {
  describe('GET /api/status', () => {
    it('should return API status', async () => {
      const response = await request(app).get('/api/status');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', '');
      
      expect(response.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', 'Bearer invalid.token.here');
      
      expect(response.status).toBe(401);
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', 'Bearer valid.token.here');
      
      // We expect a 200 status code for a valid token
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
