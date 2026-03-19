const {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse
} = require('../../utils/api-response');

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should return a success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data);
      
      expect(response).toEqual({
        success: true,
        data
      });
    });
    
    it('should include a message if provided', () => {
      const response = successResponse(null, 'Operation successful');
      
      expect(response).toEqual({
        success: true,
        data: null,
        message: 'Operation successful'
      });
    });
    
    it('should include metadata if provided', () => {
      const metadata = { timestamp: '2023-01-01' };
      const response = successResponse(null, null, metadata);
      
      expect(response).toEqual({
        success: true,
        data: null,
        ...metadata
      });
    });
  });
  
  describe('errorResponse', () => {
    it('should return an error response with message', () => {
      const response = errorResponse('Something went wrong');
      
      expect(response).toEqual({
        success: false,
        error: 'Something went wrong'
      });
    });
    
    it('should include error code if provided', () => {
      const response = errorResponse('Not found', 'NOT_FOUND');
      
      expect(response).toEqual({
        success: false,
        error: 'Not found',
        code: 'NOT_FOUND'
      });
    });
    
    it('should include error details if provided', () => {
      const details = { field: 'email', message: 'Invalid format' };
      const response = errorResponse('Validation failed', 'VALIDATION_ERROR', details);
      
      expect(response).toEqual({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details
      });
    });
  });
  
  describe('paginatedResponse', () => {
    it('should return a paginated response', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const pagination = {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      const response = paginatedResponse(items, pagination);
      
      expect(response).toEqual({
        success: true,
        data: items,
        pagination
      });
    });
    
    it('should include additional metadata if provided', () => {
      const items = [];
      const pagination = { total: 0, page: 1, limit: 10, totalPages: 0 };
      const metadata = { message: 'No items found' };
      
      const response = paginatedResponse(items, pagination, metadata);
      
      expect(response).toEqual({
        success: true,
        data: items,
        pagination,
        message: 'No items found'
      });
    });
  });
  
  describe('validationErrorResponse', () => {
    it('should format validation errors from express-validator', () => {
      const errors = [
        { param: 'email', msg: 'Invalid email', value: 'invalid' },
        { param: 'password', msg: 'Password too short', value: '123' }
      ];
      
      const response = validationErrorResponse('Validation failed', errors);
      
      expect(response).toEqual({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: [
          { field: 'email', message: 'Invalid email', value: 'invalid' },
          { field: 'password', message: 'Password too short', value: '123' }
        ]
      });
    });
    
    it('should handle empty errors array', () => {
      const response = validationErrorResponse('Validation failed', []);
      
      expect(response).toEqual({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: []
      });
    });
  });
});
