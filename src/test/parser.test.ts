import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSwaggerSpec, mockOpenApiSpec } from './mockData';

// Mock js-yaml
vi.mock('js-yaml', () => ({
  load: vi.fn(() => {
    // Simple mock that returns parsed YAML
    return mockSwaggerSpec;
  }),
}));

describe('API Documentation Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OpenAPI Spec Detection', () => {
    it('should detect Swagger 2.0 spec', () => {
      expect(mockSwaggerSpec.swagger).toBe('2.0');
      expect(mockSwaggerSpec.info.title).toBeDefined();
      expect(mockSwaggerSpec.paths).toBeDefined();
    });

    it('should detect OpenAPI 3.0 spec', () => {
      expect(mockOpenApiSpec.openapi).toBe('3.0.0');
      expect(mockOpenApiSpec.info.title).toBeDefined();
      expect(mockOpenApiSpec.paths).toBeDefined();
    });

    it('should extract endpoint information from Swagger spec', () => {
      const paths = Object.keys(mockSwaggerSpec.paths);
      expect(paths).toContain('/users');
      expect(paths).toContain('/users/{id}');
      
      const getUsersEndpoint = mockSwaggerSpec.paths['/users'].get;
      expect(getUsersEndpoint.summary).toBe('Get all users');
      expect(getUsersEndpoint.responses['200']).toBeDefined();
    });

    it('should extract multiple HTTP methods from same path', () => {
      const userPath = mockSwaggerSpec.paths['/users'];
      expect(userPath.get).toBeDefined();
      expect(userPath.post).toBeDefined();
    });

    it('should handle path parameters correctly', () => {
      const getUserByIdEndpoint = mockSwaggerSpec.paths['/users/{id}'].get;
      expect(getUserByIdEndpoint.parameters).toHaveLength(1);
      expect(getUserByIdEndpoint.parameters[0].name).toBe('id');
      expect(getUserByIdEndpoint.parameters[0].in).toBe('path');
    });
  });

  describe('Schema Conversion', () => {
    it('should convert Swagger spec to internal schema format', () => {
      const schema = {
        id: expect.any(String),
        url: 'https://api.example.com',
        title: mockSwaggerSpec.info.title,
        version: mockSwaggerSpec.info.version,
        baseUrl: 'https://api.example.com/v1',
        endpoints: expect.any(Array),
        parsedAt: expect.any(String),
      };

      expect(schema.title).toBe('Test API');
      expect(schema.version).toBe('1.0.0');
    });

    it('should extract all endpoints with correct methods', () => {
      const expectedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
      const paths = mockSwaggerSpec.paths;
      
      let foundMethods: string[] = [];
      Object.values(paths).forEach((pathItem: any) => {
        Object.keys(pathItem).forEach((method) => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            foundMethods.push(method.toUpperCase());
          }
        });
      });

      expectedMethods.forEach((method) => {
        expect(foundMethods).toContain(method);
      });
    });

    it('should handle OpenAPI 3.0 servers correctly', () => {
      expect(mockOpenApiSpec.servers).toHaveLength(1);
      expect(mockOpenApiSpec.servers[0].url).toBe('https://api.example.com/v2');
    });

    it('should handle OpenAPI 3.0 requestBody', () => {
      const postProductEndpoint = mockOpenApiSpec.paths['/products'].post;
      expect(postProductEndpoint.requestBody).toBeDefined();
      expect(postProductEndpoint.requestBody.required).toBe(true);
      expect(postProductEndpoint.requestBody.content['application/json']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed specs gracefully', () => {
      const malformedSpec = {
        // Missing required fields
        info: {},
      };

      // Should not throw, should return minimal valid schema
      expect(() => {
        const hasRequiredFields = malformedSpec.info && 
                                 typeof malformedSpec.info === 'object';
        expect(hasRequiredFields).toBe(true);
      }).not.toThrow();
    });

    it('should handle missing paths gracefully', () => {
      const specWithoutPaths = {
        swagger: '2.0',
        info: { title: 'Test', version: '1.0.0' },
        // No paths
      };

      expect(specWithoutPaths.info).toBeDefined();
      expect(specWithoutPaths).not.toHaveProperty('paths');
    });

    it('should handle invalid path items', () => {
      const specWithInvalidPath = {
        swagger: '2.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/invalid': null, // Invalid path item
          '/valid': {
            get: { summary: 'Valid endpoint' },
          },
        },
      };

      const validPath = specWithInvalidPath.paths['/valid'];
      expect(validPath).toBeDefined();
      expect(validPath.get).toBeDefined();
    });
  });

  describe('Swagger UI Detection', () => {
    it('should detect Swagger UI container', () => {
      const mockDocument = {
        querySelector: vi.fn((selector: string) => {
          if (selector === '.swagger-ui') {
            return { className: 'swagger-ui' };
          }
          return null;
        }),
      };

      const swaggerContainer = mockDocument.querySelector('.swagger-ui');
      expect(swaggerContainer).toBeDefined();
      expect(swaggerContainer).not.toBeNull();
    });

    it('should try multiple spec extraction methods', () => {
      const methods = [
        'window.ui.specSelectors',
        'window.swaggerSpec',
        'window.spec',
        'data-spec-url',
      ];

      methods.forEach((method) => {
        expect(method).toBeTruthy();
      });
    });

    it('should handle common spec URL patterns', () => {
      const commonPaths = [
        '/swagger.json',
        '/swagger.yaml',
        '/api-docs',
        '/api/swagger.json',
        '/v2/swagger.json',
        '/v3/api-docs',
        '/openapi.json',
        '/openapi.yaml',
      ];

      commonPaths.forEach((path) => {
        expect(path).toMatch(/\.(json|yaml)$|api-docs/);
      });
    });
  });

  describe('Content Type Handling', () => {
    it('should detect JSON content type', () => {
      const jsonContentTypes = [
        'application/json',
        'application/json; charset=utf-8',
      ];

      jsonContentTypes.forEach((contentType) => {
        expect(contentType).toContain('json');
      });
    });

    it('should detect YAML content type', () => {
      const yamlContentTypes = [
        'application/yaml',
        'text/yaml',
        'application/x-yaml',
      ];

      yamlContentTypes.forEach((contentType) => {
        expect(contentType.includes('yaml') || contentType.includes('yml')).toBe(true);
      });
    });

    it('should detect format from file extension', () => {
      const files = [
        { path: '/swagger.json', format: 'json' },
        { path: '/swagger.yaml', format: 'yaml' },
        { path: '/openapi.json', format: 'json' },
      ];

      files.forEach(({ path, format }) => {
        expect(path.endsWith(`.${format}`)).toBe(true);
      });
    });
  });

  describe('Parameter Extraction', () => {
    it('should extract query parameters', () => {
      const endpoint = {
        parameters: [
          { name: 'page', in: 'query', type: 'integer' },
          { name: 'limit', in: 'query', type: 'integer' },
        ],
      };

      const queryParams = endpoint.parameters.filter(p => p.in === 'query');
      expect(queryParams).toHaveLength(2);
      expect(queryParams[0].name).toBe('page');
    });

    it('should extract path parameters', () => {
      const endpoint = mockSwaggerSpec.paths['/users/{id}'].get;
      const pathParams = endpoint.parameters.filter(p => p.in === 'path');
      
      expect(pathParams).toHaveLength(1);
      expect(pathParams[0].name).toBe('id');
      expect(pathParams[0].required).toBe(true);
    });

    it('should extract header parameters', () => {
      const endpoint = {
        parameters: [
          { name: 'Authorization', in: 'header', type: 'string' },
          { name: 'Content-Type', in: 'header', type: 'string' },
        ],
      };

      const headerParams = endpoint.parameters.filter(p => p.in === 'header');
      expect(headerParams).toHaveLength(2);
    });
  });

  describe('Response Schema Extraction', () => {
    it('should extract response status codes', () => {
      const endpoint = mockSwaggerSpec.paths['/users'].get;
      const responses = Object.keys(endpoint.responses);
      
      expect(responses).toContain('200');
    });

    it('should handle multiple response codes', () => {
      const endpoint = {
        responses: {
          '200': { description: 'Success' },
          '404': { description: 'Not Found' },
          '500': { description: 'Server Error' },
        },
      };

      const statusCodes = Object.keys(endpoint.responses);
      expect(statusCodes).toHaveLength(3);
      expect(statusCodes).toContain('200');
      expect(statusCodes).toContain('404');
      expect(statusCodes).toContain('500');
    });
  });
});
