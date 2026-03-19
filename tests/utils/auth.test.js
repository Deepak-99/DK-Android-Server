const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken, verifyToken, hashPassword, comparePasswords } = require('../../utils/auth');
const config = require('../../config');

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
      
      // Verify the hash can be verified
      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
    });
    
    it('should compare passwords correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Test correct password
      let isMatch = await comparePasswords(password, hashedPassword);
      expect(isMatch).toBe(true);
      
      // Test incorrect password
      isMatch = await comparePasswords('wrongPassword', hashedPassword);
      expect(isMatch).toBe(false);
    });
    
    it('should handle empty or invalid passwords', async () => {
      await expect(hashPassword('')).rejects.toThrow();
      await expect(comparePasswords('', 'hash')).rejects.toThrow();
      await expect(comparePasswords('password', '')).rejects.toThrow();
    });
  });
  
  describe('JWT Token Generation and Verification', () => {
    const testUser = {
      id: 1,
      email: 'test@example.com',
      role: 'user'
    };
    
    it('should generate a valid JWT token', () => {
      const token = generateToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token can be decoded
      const decoded = jwt.verify(token, config.jwt.secret);
      expect(decoded).toHaveProperty('userId', testUser.id);
      expect(decoded).toHaveProperty('role', testUser.role);
    });
    
    it('should verify a valid JWT token', () => {
      const token = jwt.sign(
        { userId: testUser.id, role: testUser.role },
        config.jwt.secret,
        { expiresIn: '1h' }
      );
      
      const decoded = verifyToken(token);
      expect(decoded).toHaveProperty('userId', testUser.id);
      expect(decoded).toHaveProperty('role', testUser.role);
    });
    
    it('should throw an error for invalid tokens', () => {
      // Invalid token
      expect(() => verifyToken('invalid.token.here')).toThrow('Invalid token');
      
      // Expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, role: testUser.role },
        config.jwt.secret,
        { expiresIn: '-1s' } // Expired 1 second ago
      );
      
      expect(() => verifyToken(expiredToken)).toThrow('jwt expired');
    });
    
    it('should handle token with invalid signature', () => {
      const token = jwt.sign(
        { userId: testUser.id, role: testUser.role },
        'wrong-secret-key', // Different secret
        { expiresIn: '1h' }
      );
      
      expect(() => verifyToken(token)).toThrow('Invalid token');
    });
  });
  
  describe('Token Refresh', () => {
    const testUser = {
      id: 1,
      email: 'test@example.com',
      role: 'user'
    };
    
    it('should generate a refresh token', () => {
      const refreshToken = generateToken(testUser, true); // true for refresh token
      
      expect(refreshToken).toBeDefined();
      
      // Verify the refresh token has a longer expiry
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      expect(decoded).toHaveProperty('userId', testUser.id);
      expect(decoded).toHaveProperty('role', testUser.role);
    });
    
    it('should verify a refresh token', () => {
      const refreshToken = jwt.sign(
        { userId: testUser.id, role: testUser.role },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );
      
      const decoded = verifyToken(refreshToken, true);
      expect(decoded).toHaveProperty('userId', testUser.id);
    });
  });
});
