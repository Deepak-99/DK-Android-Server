const httpMocks = require('node-mocks-http');
const { validationResult } = require('express-validator');
const { validate } = require('../../middleware/validation');

// Mock express-validator
jest.mock('express-validator', () => ({
  ...jest.requireActual('express-validator'),
  validationResult: jest.fn()
}));

describe('Validation Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Create mock request, response and next function
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  it('should call next() when there are no validation errors', () => {
    // Mock validationResult to return no errors
    validationResult.mockImplementation(() => ({
      isEmpty: () => true,
      array: () => []
    }));
    
    // Create a validation middleware for testing
    const validationMiddleware = validate('test');
    
    // Call the middleware
    validationMiddleware(req, res, next);
    
    // Verify next() was called
    expect(next).toHaveBeenCalled();
    // Verify no response was sent
    expect(res.statusCode).not.toBe(400);
  });
  
  it('should return 400 with validation errors when validation fails', () => {
    // Mock validation errors
    const mockErrors = [
      { param: 'email', msg: 'Invalid email' },
      { param: 'password', msg: 'Password is required' }
    ];
    
    // Mock validationResult to return errors
    validationResult.mockImplementation(() => ({
      isEmpty: () => false,
      array: () => mockErrors,
      formatWith: () => ({ array: () => mockErrors })
    }));
    
    // Create a validation middleware for testing
    const validationMiddleware = validate('test');
    
    // Call the middleware
    validationMiddleware(req, res, next);
    
    // Verify response status is 400
    expect(res.statusCode).toBe(400);
    
    // Verify response body contains validation errors
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: mockErrors
    });
    
    // Verify next() was not called
    expect(next).not.toHaveBeenCalled();
  });
  
  it('should handle custom error message', () => {
    const customMessage = 'Custom validation error message';
    const mockErrors = [{ param: 'field', msg: 'Error' }];
    
    // Mock validationResult to return errors
    validationResult.mockImplementation(() => ({
      isEmpty: () => false,
      array: () => mockErrors,
      formatWith: () => ({ array: () => mockErrors })
    }));
    
    // Create a validation middleware with custom message
    const validationMiddleware = validate('test', customMessage);
    
    // Call the middleware
    validationMiddleware(req, res, next);
    
    // Verify response contains custom error message
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe(customMessage);
  });
  
  it('should handle custom status code', () => {
    const customStatus = 422; // Unprocessable Entity
    const mockErrors = [{ param: 'field', msg: 'Error' }];
    
    // Mock validationResult to return errors
    validationResult.mockImplementation(() => ({
      isEmpty: () => false,
      array: () => mockErrors,
      formatWith: () => ({ array: () => mockErrors })
    }));
    
    // Create a validation middleware with custom status
    const validationMiddleware = validate('test', null, customStatus);
    
    // Call the middleware
    validationMiddleware(req, res, next);
    
    // Verify response status is custom status code
    expect(res.statusCode).toBe(customStatus);
  });
  
  it('should handle empty validation errors array', () => {
    // Mock empty errors array (shouldn't happen, but good to test)
    validationResult.mockImplementation(() => ({
      isEmpty: () => false,
      array: () => [],
      formatWith: () => ({ array: () => [] })
    }));
    
    const validationMiddleware = validate('test');
    validationMiddleware(req, res, next);
    
    // Should still return 400 with a generic error
    expect(res.statusCode).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('Validation failed');
  });
});
