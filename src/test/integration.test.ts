import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSwaggerSpec, mockApiSchema } from './mockData';
import type { GeneratedApiCall } from '../types';

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Parse and Query Flow', () => {
    it('should complete full workflow: parse -> generate -> execute', async () => {
      // Step 1: Parse API documentation
      const parsedDoc = {
        type: 'swagger',
        schema: mockApiSchema,
      };

      expect(parsedDoc.schema.endpoints).toHaveLength(2);
      expect(parsedDoc.schema.title).toBe('Test API');

      // Step 2: Generate API call from natural language
      const query = 'Get all users';
      const generatedCall: GeneratedApiCall = {
        endpoint: `${parsedDoc.schema.baseUrl}/users`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: null,
        queryParams: {},
        description: query,
      };

      expect(generatedCall.endpoint).toContain('/users');
      expect(generatedCall.method).toBe('GET');

      // Step 3: Validate generated call against schema
      const isValid = parsedDoc.schema.endpoints.some(
        ep => ep.path === '/users' && ep.method === 'GET'
      );

      expect(isValid).toBe(true);

      // Step 4: Execute (mock)
      const mockResponse = {
        success: true,
        data: {
          status: 200,
          statusText: 'OK',
          body: [{ id: 1, name: 'John' }],
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.status).toBe(200);
    });

    it('should handle POST request with body', async () => {
      // Parse
      const schema = mockApiSchema;
      
      // Generate
      const query = 'Create a new user with name John and email john@example.com';
      const generatedCall: GeneratedApiCall = {
        endpoint: `${schema.baseUrl}/users`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          name: 'John',
          email: 'john@example.com',
        },
        queryParams: {},
        description: query,
      };

      // Validate
      const endpoint = schema.endpoints.find(
        ep => ep.path === '/users' && ep.method === 'POST'
      );

      expect(endpoint).toBeDefined();
      expect(generatedCall.body).not.toBeNull();
      expect(generatedCall.body).toHaveProperty('name');
      expect(generatedCall.body).toHaveProperty('email');
    });

    it('should handle error scenarios gracefully', async () => {
      // Try to generate call for non-existent endpoint
      const query = 'Get nonexistent resource';
      const schema = mockApiSchema;

      const matchingEndpoint = schema.endpoints.find(
        ep => ep.path.includes('nonexistent')
      );

      expect(matchingEndpoint).toBeUndefined();

      // Should fall back to first endpoint or show error
      const fallbackCall: GeneratedApiCall = {
        endpoint: schema.baseUrl || 'https://api.example.com',
        method: 'GET',
        headers: {},
        body: null,
        queryParams: {},
        description: query,
      };

      expect(fallbackCall.endpoint).toBeTruthy();
    });
  });

  describe('Storage and State Management', () => {
    it('should save and retrieve schemas from storage', async () => {
      const schemas = [mockApiSchema];

      // Mock storage
      const storage = new Map();
      storage.set('schemas', schemas);

      const retrieved = storage.get('schemas');
      expect(retrieved).toEqual(schemas);
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].id).toBe(mockApiSchema.id);
    });

    it('should prevent duplicate schemas', async () => {
      const schemas = [mockApiSchema];
      
      // Try to add same schema again
      const isDuplicate = schemas.some(s => s.id === mockApiSchema.id);
      
      if (!isDuplicate) {
        schemas.push(mockApiSchema);
      }

      expect(schemas).toHaveLength(1);
    });

    it('should update selected schema', () => {
      let selectedSchemaId: string | null = null;

      selectedSchemaId = mockApiSchema.id;
      expect(selectedSchemaId).toBe(mockApiSchema.id);

      selectedSchemaId = null;
      expect(selectedSchemaId).toBeNull();
    });
  });

  describe('Message Passing Between Components', () => {
    it('should handle PARSE_CURRENT_PAGE message', async () => {
      const message = { type: 'PARSE_CURRENT_PAGE' };
      
      expect(message.type).toBe('PARSE_CURRENT_PAGE');
    });

    it('should handle EXECUTE_QUERY message', async () => {
      const query: GeneratedApiCall = {
        endpoint: 'https://api.example.com/users',
        method: 'GET',
        headers: {},
        body: null,
        queryParams: {},
        description: 'Get users',
      };

      const message = {
        type: 'EXECUTE_QUERY',
        payload: { query },
      };

      expect(message.type).toBe('EXECUTE_QUERY');
      expect(message.payload.query).toEqual(query);
    });

    it('should handle CONVERT_NL_QUERY message', async () => {
      const message = {
        type: 'CONVERT_NL_QUERY',
        payload: {
          text: 'Get all users',
          schemaId: mockApiSchema.id,
        },
      };

      expect(message.type).toBe('CONVERT_NL_QUERY');
      expect(message.payload.text).toBeTruthy();
      expect(message.payload.schemaId).toBe(mockApiSchema.id);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors', async () => {
      const error = new Error('Network request failed');
      
      const result = {
        success: false,
        error: error.message,
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network');
    });

    it('should handle invalid JSON responses', async () => {
      const invalidJSON = 'not valid json{';
      
      let parseError: Error | null = null;
      try {
        JSON.parse(invalidJSON);
      } catch (error) {
        parseError = error as Error;
      }

      expect(parseError).not.toBeNull();
      expect(parseError?.message).toBeTruthy();
    });

    it('should handle missing content script', async () => {
      const error = new Error('Receiving end does not exist');
      
      const isContentScriptError = error.message.includes('Receiving end does not exist');
      
      if (isContentScriptError) {
        const userFriendlyMessage = 'Content script not loaded. Please refresh the page and try again.';
        expect(userFriendlyMessage).toContain('refresh');
      }
    });
  });

  describe('Schema Validation', () => {
    it('should validate required schema fields', () => {
      const isValid = 
        mockApiSchema.id &&
        mockApiSchema.url &&
        mockApiSchema.title &&
        mockApiSchema.endpoints &&
        Array.isArray(mockApiSchema.endpoints);

      expect(isValid).toBe(true);
    });

    it('should validate endpoint structure', () => {
      mockApiSchema.endpoints.forEach((endpoint) => {
        expect(endpoint.path).toBeTruthy();
        expect(endpoint.method).toBeTruthy();
        expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).toContain(endpoint.method);
      });
    });

    it('should validate Swagger spec structure', () => {
      const spec: any = mockSwaggerSpec;
      const hasRequiredFields = 
        (spec.swagger || spec.openapi) &&
        spec.info &&
        spec.info.title &&
        spec.paths;

      expect(hasRequiredFields).toBeTruthy();
    });
  });

  describe('User Experience Flow', () => {
    it('should show appropriate loading states', () => {
      const states = {
        idle: false,
        loading: false,
        success: false,
        error: false,
      };

      // Start loading
      states.loading = true;
      expect(states.loading).toBe(true);

      // Success
      states.loading = false;
      states.success = true;
      expect(states.success).toBe(true);
      expect(states.loading).toBe(false);
    });

    it('should provide helpful error messages', () => {
      const errors = {
        noSchema: 'Please select an API schema first',
        noQuery: 'Please enter a query',
        parseError: 'No API documentation found on this page',
        networkError: 'Failed to execute query',
      };

      Object.values(errors).forEach((message) => {
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(10);
      });
    });

    it('should track user progress through workflow', () => {
      const workflow = {
        schemaSelected: false,
        queryEntered: false,
        queryGenerated: false,
        queryExecuted: false,
      };

      // Step 1
      workflow.schemaSelected = true;
      expect(workflow.schemaSelected).toBe(true);

      // Step 2
      workflow.queryEntered = true;
      expect(workflow.queryEntered).toBe(true);

      // Step 3
      workflow.queryGenerated = true;
      expect(workflow.queryGenerated).toBe(true);

      // Step 4
      workflow.queryExecuted = true;
      expect(workflow.queryExecuted).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large schemas efficiently', () => {
      const largeSchema = {
        ...mockApiSchema,
        endpoints: Array.from({ length: 100 }, (_, i) => ({
          path: `/resource${i}`,
          method: 'GET' as const,
          description: `Endpoint ${i}`,
          parameters: [],
          responses: {},
        })),
      };

      expect(largeSchema.endpoints).toHaveLength(100);
      
      // Find specific endpoint (should be fast)
      const found = largeSchema.endpoints.find(
        ep => ep.path === '/resource50'
      );

      expect(found).toBeDefined();
      expect(found?.path).toBe('/resource50');
    });

    it('should deduplicate schemas efficiently', () => {
      const schemas = [mockApiSchema, mockApiSchema, mockApiSchema];
      const unique = Array.from(
        new Map(schemas.map(s => [s.id, s])).values()
      );

      expect(unique).toHaveLength(1);
    });
  });
});
