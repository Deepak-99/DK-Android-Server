const swaggerJsdoc = require('swagger-jsdoc');
const packageJson = require('../package.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DK Hawkshaw API',
      version: packageJson.version || '1.0.0',
      description: 'API documentation for DK Hawkshaw Server',
      contact: {
        name: 'DK Hawkshaw Support',
        email: 'support@dkhawkshaw.com',
      },
      license: {
        name: 'Private',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.dkhawkshaw.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>'
        },
        deviceAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Device-Token',
          description: 'Device authentication token'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Invalid or missing authentication credentials',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
              }
            }
          }
        },
        BadRequest: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Invalid parameters provided',
                code: 'INVALID_INPUT'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Resource not found',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'An unexpected error occurred',
                code: 'INTERNAL_SERVER_ERROR'
              }
            }
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Human-readable error message'
            },
            code: {
              type: 'string',
              description: 'Machine-readable error code'
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              additionalProperties: true
            },
            requestId: {
              type: 'string',
              description: 'Unique request identifier for support',
              example: 'abc123'
            }
          },
          required: ['success', 'error'],
          additionalProperties: false
        },
        Pagination: {
          type: 'object',
          properties: {
            current_page: {
              type: 'integer',
              example: 1,
              description: 'Current page number'
            },
            total_pages: {
              type: 'integer',
              example: 5,
              description: 'Total number of pages'
            },
            total_count: {
              type: 'integer',
              example: 100,
              description: 'Total number of items'
            },
            per_page: {
              type: 'integer',
              example: 20,
              description: 'Number of items per page'
            }
          },
          required: ['current_page', 'total_pages', 'total_count', 'per_page']
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Path to the API docs
  apis: [
    './routes/*.js',
    './models/*.js',
    './docs/*.yaml',
    './docs/*.yml'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
