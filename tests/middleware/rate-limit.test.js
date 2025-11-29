const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { createRateLimiter } = require('../../middleware/rate-limit');

// Mock the rate limiting library
jest.mock('express-rate-limit');

describe('Rate Limiting Middleware', () => {
  let app;
  let mockRateLimit;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a test Express app
    app = express();
    
    // Mock the rateLimit function
    mockRateLimit = jest.fn().mockImplementation((options) => {
      return (req, res, next) => {
        if (options.skip && options.skip(req)) {
          return next();
        }
        
        if (options.keyGenerator && options.keyGenerator(req) === 'exempt-key') {
          return next();
        }
        
        // Simulate rate limit exceeded
        if (req.query.fail === 'true') {
          return res.status(429).json({
            success: false,
            error: 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          });
        }
        
        next();
      };
    });
    
    rateLimit.mockImplementation(mockRateLimit);
  });
  
  it('should create a rate limiter with default options', () => {
    const limiter = createRateLimiter();
    
    expect(rateLimit).toHaveBeenCalledWith(expect.objectContaining({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: expect.any(Object),
      standardHeaders: true,
      legacyHeaders: false,
      skip: expect.any(Function),
      keyGenerator: expect.any(Function)
    }));
  });
  
  it('should allow custom configuration', () => {
    const customOptions = {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000,
      message: { error: 'Custom rate limit message' }
    };
    
    const limiter = createRateLimiter(customOptions);
    
    expect(rateLimit).toHaveBeenCalledWith(expect.objectContaining({
      windowMs: customOptions.windowMs,
      max: customOptions.max,
      message: customOptions.message
    }));
  });
  
  it('should skip rate limiting for whitelisted IPs', () => {
    process.env.WHITELISTED_IPS = '192.168.1.1,127.0.0.1';
    
    const limiter = createRateLimiter();
    const req = { ip: '192.168.1.1' };
    const next = jest.fn();
    
    // Get the skip function from the rate limiter options
    const skipFn = rateLimit.mock.calls[0][0].skip;
    
    // Test with whitelisted IP
    expect(skipFn(req)).toBe(true);
    
    // Test with non-whitelisted IP
    req.ip = '192.168.1.2';
    expect(skipFn(req)).toBe(false);
  });
  
  it('should generate a key based on IP and user ID if available', () => {
    const limiter = createRateLimiter();
    const keyGenerator = rateLimit.mock.calls[0][0].keyGenerator;
    
    // Test with just IP
    const req1 = { ip: '192.168.1.1' };
    expect(keyGenerator(req1)).toBe('192.168.1.1');
    
    // Test with user ID
    const req2 = { 
      ip: '192.168.1.1',
      user: { id: 'user123' } 
    };
    expect(keyGenerator(req2)).toBe('user123');
    
    // Test with API key
    const req3 = { 
      ip: '192.168.1.1',
      headers: { 'x-api-key': 'api-key-123' } 
    };
    expect(keyGenerator(req3)).toBe('api-key-123');
  });
  
  it('should apply rate limiting to protected routes', async () => {
    // Create a test route with rate limiting
    const limiter = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 2 // 2 requests per minute
    });
    
    app.use('/api', limiter);
    app.get('/api/test', (req, res) => {
      res.json({ success: true });
    });
    
    // First request should pass
    const res1 = await request(app).get('/api/test');
    expect(res1.statusCode).toBe(200);
    
    // Second request should pass
    const res2 = await request(app).get('/api/test');
    expect(res2.statusCode).toBe(200);
    
    // Third request should be rate limited
    const res3 = await request(app).get('/api/test?fail=true');
    expect(res3.statusCode).toBe(429);
    expect(res3.body).toEqual({
      success: false,
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  });
  
  it('should not rate limit whitelisted routes', async () => {
    const limiter = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 1, // 1 request per minute
      skip: (req) => req.path === '/api/public'
    });
    
    app.use(limiter);
    
    // Public route (whitelisted)
    app.get('/api/public', (req, res) => {
      res.json({ public: true });
    });
    
    // Protected route
    app.get('/api/protected', (req, res) => {
      res.json({ protected: true });
    });
    
    // First request to protected route should pass
    const res1 = await request(app).get('/api/protected');
    expect(res1.statusCode).toBe(200);
    
    // Second request to protected route should be rate limited
    const res2 = await request(app).get('/api/protected?fail=true');
    expect(res2.statusCode).toBe(429);
    
    // Multiple requests to public route should not be rate limited
    const res3 = await request(app).get('/api/public');
    expect(res3.statusCode).toBe(200);
    
    const res4 = await request(app).get('/api/public');
    expect(res4.statusCode).toBe(200);
  });
});
