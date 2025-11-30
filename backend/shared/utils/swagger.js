/**
 * Swagger/OpenAPI Configuration
 * Provides interactive API documentation
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Create Swagger configuration for a service
 * @param {Object} config - Service configuration
 * @param {string} config.serviceName - Name of the service
 * @param {string} config.version - API version
 * @param {string} config.description - Service description
 * @param {number} config.port - Service port
 * @param {Array} config.apis - Array of API route file paths
 */
const createSwaggerConfig = (config) => {
  const {
    serviceName,
    version = '1.0.0',
    description = 'MapPaletteV2 Microservice API',
    port,
    apis = [],
  } = config;

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: `${serviceName} API`,
        version,
        description,
        contact: {
          name: 'MapPaletteV2 Team',
        },
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: 'Development server',
        },
        {
          url: `https://api.mappalette.com`,
          description: 'Production server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Supabase JWT token from authentication',
          },
          InternalServiceKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Internal-Service-Key',
            description: 'Internal service authentication key',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                example: false,
              },
              error: {
                type: 'object',
                properties: {
                  code: {
                    type: 'string',
                    example: 'VALIDATION_ERROR',
                  },
                  message: {
                    type: 'string',
                    example: 'Validation failed',
                  },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                        },
                        message: {
                          type: 'string',
                        },
                      },
                    },
                  },
                  requestId: {
                    type: 'string',
                    format: 'uuid',
                  },
                },
              },
            },
          },
          UUID: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          Pagination: {
            type: 'object',
            properties: {
              cursor: {
                type: 'string',
                description: 'Cursor for pagination',
                example: 'eyJpZCI6IjEyMyJ9',
              },
              limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20,
                description: 'Number of items to return',
              },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/UUID' },
              username: {
                type: 'string',
                example: 'johndoe',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'john@example.com',
              },
              displayName: {
                type: 'string',
                example: 'John Doe',
              },
              profilePicture: {
                type: 'string',
                format: 'uri',
                nullable: true,
              },
              bio: {
                type: 'string',
                nullable: true,
              },
              followerCount: {
                type: 'integer',
                example: 150,
              },
              followingCount: {
                type: 'integer',
                example: 75,
              },
              postCount: {
                type: 'integer',
                example: 42,
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Post: {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/UUID' },
              userId: { $ref: '#/components/schemas/UUID' },
              name: {
                type: 'string',
                example: 'Morning Hike Route',
              },
              description: {
                type: 'string',
                nullable: true,
              },
              routeData: {
                type: 'object',
                description: 'GeoJSON route data',
              },
              distance: {
                type: 'number',
                example: 5.2,
                description: 'Distance in kilometers',
              },
              duration: {
                type: 'number',
                example: 120,
                description: 'Duration in minutes',
              },
              difficulty: {
                type: 'string',
                enum: ['easy', 'moderate', 'hard'],
                example: 'moderate',
              },
              isPublic: {
                type: 'boolean',
                default: true,
              },
              likeCount: {
                type: 'integer',
                example: 25,
              },
              commentCount: {
                type: 'integer',
                example: 8,
              },
              shareCount: {
                type: 'integer',
                example: 3,
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          Comment: {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/UUID' },
              userId: { $ref: '#/components/schemas/UUID' },
              entityType: {
                type: 'string',
                enum: ['post', 'comment', 'route'],
              },
              entityId: { $ref: '#/components/schemas/UUID' },
              content: {
                type: 'string',
                maxLength: 500,
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
        },
        responses: {
          UnauthorizedError: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                example: {
                  success: false,
                  error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                  },
                },
              },
            },
          },
          ForbiddenError: {
            description: 'Insufficient permissions',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                example: {
                  success: false,
                  error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions',
                  },
                },
              },
            },
          },
          NotFoundError: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                example: {
                  success: false,
                  error: {
                    code: 'NOT_FOUND',
                    message: 'Resource not found',
                  },
                },
              },
            },
          },
          ValidationError: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                example: {
                  success: false,
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: [
                      {
                        field: 'username',
                        message: 'Username must be at least 3 characters',
                      },
                    ],
                  },
                },
              },
            },
          },
          RateLimitError: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                example: {
                  success: false,
                  error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests, please try again later',
                    retryAfter: '900',
                  },
                },
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'Health',
          description: 'Health check endpoints',
        },
      ],
    },
    apis,
  };

  const specs = swaggerJsdoc(options);

  return {
    specs,
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: `${serviceName} API Documentation`,
    }),
  };
};

module.exports = { createSwaggerConfig };
