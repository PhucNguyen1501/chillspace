import type { ApiSchema } from '../types';

export const mockSwaggerSpec = {
  swagger: '2.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
    description: 'Test API Description',
  },
  host: 'api.example.com',
  basePath: '/v1',
  schemes: ['https'],
  paths: {
    '/users': {
      get: {
        summary: 'Get all users',
        description: 'Retrieve a list of all users',
        parameters: [],
        responses: {
          '200': {
            description: 'Success',
          },
        },
      },
      post: {
        summary: 'Create a user',
        description: 'Create a new user',
        parameters: [
          {
            name: 'body',
            in: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        ],
        responses: {
          '201': {
            description: 'Created',
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Retrieve a specific user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          '200': {
            description: 'Success',
          },
        },
      },
      put: {
        summary: 'Update user',
        description: 'Update an existing user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          '200': {
            description: 'Updated',
          },
        },
      },
      delete: {
        summary: 'Delete user',
        description: 'Delete a user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
  },
};

export const mockOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test OpenAPI',
    version: '2.0.0',
  },
  servers: [
    {
      url: 'https://api.example.com/v2',
    },
  ],
  paths: {
    '/products': {
      get: {
        summary: 'List products',
        responses: {
          '200': {
            description: 'Success',
          },
        },
      },
      post: {
        summary: 'Create product',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
          },
        },
      },
    },
  },
};

export const mockApiSchema: ApiSchema = {
  id: 'test-schema-123',
  url: 'https://api.example.com',
  title: 'Test API',
  version: '1.0.0',
  baseUrl: 'https://api.example.com/v1',
  endpoints: [
    {
      path: '/users',
      method: 'GET',
      description: 'Get all users',
      parameters: [],
      responses: {
        '200': { description: 'Success' },
      },
    },
    {
      path: '/users',
      method: 'POST',
      description: 'Create a user',
      parameters: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Created' },
      },
    },
  ],
  parsedAt: new Date().toISOString(),
};
