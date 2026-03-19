const request = require('supertest');
const express = require('express');
const errorHandler = require('../../middleware/errorHandler');
const AppError = require('../../utils/appError');

describe('Error Handling Middleware', () => {
  let app;
  
  beforeAll(() => {
    // Create a test Express app
    app = express();
    
    // Add a test route that throws an error
    app.get('/test-error', (req, res, next) => {
      const error = new Error('Test error');
      error.statusCode = 400;
      next(error);
    });
    
    // Add a test route that throws an AppError
    app.get('/test-app-error', (req, res, next) => {
      next(new AppError('Test AppError', 400, 'TEST_ERROR'));
    });
    
    // Add a test route that throws a validation error
    app.get('/test-validation-error', (req, res, next) => {
      const error = new Error('Validation error');
      error.name = 'SequelizeValidationError';
      error.errors = [
        { message: 'Name is required', path: 'name' },
        { message: 'Email is invalid', path: 'email' }
      ];
      next(error);
    });
    
    // Add a test route that throws a database error
    app.get('/test-db-error', (req, res, next) => {
      const error = new Error('Database error');
      error.name = 'SequelizeDatabaseError';
      next(error);
    });
    
    // Add a test route that throws a 404 error
    app.get('/test-not-found', (req, res, next) => {
      const error = new Error('Not found');
      error.statusCode = 404;
      next(error);
    });
    
    // Add a test route that throws an unhandled error
    app.get('/test-unhandled', (req, res, next) => {
      throw new Error('Unhandled error');
    });
    
    // Add the error handler middleware
    app.use(errorHandler);
  });
  
  it('should handle standard errors', async () => {
    const response = await request(app)
      .get('/test-error');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'Test error');
    expect(response.body).toHaveProperty('stack');
  });
  
  it('should handle AppError instances', async () => {
    const response = await request(app)
      .get('/test-app-error');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'Test AppError');
    expect(response.body).toHaveProperty('code', 'TEST_ERROR');
  });
  
  it('should handle validation errors', async () => {
    const response = await request(app)
      .get('/test-validation-error');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'Validation error');
    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors).toHaveLength(2);
  });
  
  it('should handle database errors', async () => {
    const response = await request(app)
      .get('/test-db-error');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'Database error');
  });
  
  it('should handle 404 errors', async () => {
    const response = await request(app)
      .get('/non-existent-route');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'Not Found');
  });
  
  it('should handle unhandled errors', async () => {
    const response = await request(app)
      .get('/test-unhandled');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'Something went wrong');
  });
});
