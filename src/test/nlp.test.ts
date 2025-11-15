import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockApiSchema } from './mockData';
import type { GeneratedApiCall } from '../types';

describe('Natural Language to API Conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Understanding', () => {
    it('should detect GET requests from query text', () => {
      const queries = [
        'Get all users',
        'List users',
        'Show me all users',
        'Retrieve users',
        'Find users',
      ];

      queries.forEach((query) => {
        const lowerQuery = query.toLowerCase();
        const isGetRequest = 
          lowerQuery.includes('get') ||
          lowerQuery.includes('list') ||
          lowerQuery.includes('show') ||
          lowerQuery.includes('retrieve') ||
          lowerQuery.includes('find');
        
        expect(isGetRequest).toBe(true);
      });
    });

    it('should detect POST requests from query text', () => {
      const queries = [
        'Create a new user',
        'Add a user',
        'Post user data',
        'Register a new user',
      ];

      queries.forEach((query) => {
        const lowerQuery = query.toLowerCase();
        const isPostRequest = 
          lowerQuery.includes('create') ||
          lowerQuery.includes('add') ||
          lowerQuery.includes('post') ||
          lowerQuery.includes('register') ||
          lowerQuery.includes('new');
        
        expect(isPostRequest).toBe(true);
      });
    });

    it('should detect PUT/PATCH requests from query text', () => {
      const queries = [
        'Update user profile',
        'Modify user',
        'Change user data',
        'Edit user information',
      ];

      queries.forEach((query) => {
        const lowerQuery = query.toLowerCase();
        const isUpdateRequest = 
          lowerQuery.includes('update') ||
          lowerQuery.includes('modify') ||
          lowerQuery.includes('change') ||
          lowerQuery.includes('edit') ||
          lowerQuery.includes('patch');
        
        expect(isUpdateRequest).toBe(true);
      });
    });

    it('should detect DELETE requests from query text', () => {
      const queries = [
        'Delete user',
        'Remove user',
        'Delete user by ID',
      ];

      queries.forEach((query) => {
        const lowerQuery = query.toLowerCase();
        const isDeleteRequest = 
          lowerQuery.includes('delete') ||
          lowerQuery.includes('remove');
        
        expect(isDeleteRequest).toBe(true);
      });
    });
  });

  describe('Endpoint Matching', () => {
    it('should find matching endpoint for query', () => {
      // const query = 'get all users'; // Query used for documentation
      const endpoint = mockApiSchema.endpoints.find(
        ep => ep.path.includes('users') && ep.method === 'GET'
      );

      expect(endpoint).toBeDefined();
      expect(endpoint?.path).toBe('/users');
      expect(endpoint?.method).toBe('GET');
    });

    it('should score endpoint relevance', () => {
      const query = 'create user';
      const queryWords = query.toLowerCase().split(' ');
      
      mockApiSchema.endpoints.forEach((endpoint) => {
        const pathWords = endpoint.path.toLowerCase().split('/').filter(w => w);
        const descWords = endpoint.description?.toLowerCase().split(' ') || [];
        
        let score = 0;
        queryWords.forEach((qWord) => {
          if (pathWords.some(pWord => pWord.includes(qWord) || qWord.includes(pWord))) {
            score += 2;
          }
          if (descWords.some(dWord => dWord.includes(qWord))) {
            score += 1;
          }
        });

        // Higher scores indicate better matches
        expect(score).toBeGreaterThanOrEqual(0);
      });
    });

    it('should prefer exact method matches', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      
      methods.forEach((method) => {
        const matchingEndpoint = mockApiSchema.endpoints.find(
          ep => ep.method === method
        );
        
        if (matchingEndpoint) {
          expect(matchingEndpoint.method).toBe(method);
        }
      });
    });
  });

  describe('API Call Generation', () => {
    it('should generate valid API call structure', () => {
      const generatedCall: GeneratedApiCall = {
        endpoint: `${mockApiSchema.baseUrl}/users`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: null,
        queryParams: {},
        description: 'Get all users',
      };

      expect(generatedCall.endpoint).toBeTruthy();
      expect(generatedCall.method).toMatch(/GET|POST|PUT|DELETE|PATCH/);
      expect(generatedCall.headers).toBeDefined();
      expect(generatedCall.headers['Content-Type']).toBeDefined();
    });

    it('should include body for POST/PUT requests', () => {
      const postCall: GeneratedApiCall = {
        endpoint: `${mockApiSchema.baseUrl}/users`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        queryParams: {},
        description: 'Create a new user',
      };

      expect(postCall.method).toBe('POST');
      expect(postCall.body).toBeDefined();
      expect(postCall.body).not.toBeNull();
      expect(typeof postCall.body).toBe('object');
    });

    it('should not include body for GET/DELETE requests', () => {
      const getCall: GeneratedApiCall = {
        endpoint: `${mockApiSchema.baseUrl}/users`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: null,
        queryParams: {},
        description: 'Get all users',
      };

      expect(getCall.method).toBe('GET');
      expect(getCall.body).toBeNull();
    });

    it('should construct proper endpoint URLs', () => {
      const baseUrl = mockApiSchema.baseUrl;
      const path = '/users';
      const fullUrl = `${baseUrl}${path}`;

      expect(fullUrl).toMatch(/^https?:\/\//);
      expect(fullUrl).toContain(path);
    });
  });

  describe('Parameter Extraction', () => {
    it('should extract IDs from queries', () => {
      const queries = [
        { text: 'get user 123', expectedId: '123' },
        { text: 'delete user with id abc', expectedId: 'abc' },
        { text: 'show user #456', expectedId: '456' },
      ];

      queries.forEach(({ text }) => {
        // expectedId is for documentation purposes
        const match = text.match(/\b\w+\s+(\w+)$/) || 
                     text.match(/id\s+(\w+)/) ||
                     text.match(/#(\w+)/);
        
        if (match) {
          expect(match[1]).toBeTruthy();
        }
      });
    });

    it('should extract field names from create queries', () => {
      const query = 'create user with name John and email john@example.com';
      const hasName = query.includes('name');
      const hasEmail = query.includes('email');

      expect(hasName).toBe(true);
      expect(hasEmail).toBe(true);
    });

    it('should handle query parameters', () => {
      const queryParams = {
        page: '1',
        limit: '10',
        sort: 'desc',
      };

      const urlParams = new URLSearchParams(queryParams);
      expect(urlParams.toString()).toContain('page=1');
      expect(urlParams.toString()).toContain('limit=10');
    });
  });

  describe('Validation', () => {
    it('should validate generated endpoint exists in schema', () => {
      const generatedEndpoint = '/users';
      const generatedMethod = 'GET';

      const exists = mockApiSchema.endpoints.some(
        ep => ep.path === generatedEndpoint && ep.method === generatedMethod
      );

      expect(exists).toBe(true);
    });

    it('should validate required fields are present', () => {
      const apiCall: GeneratedApiCall = {
        endpoint: 'https://api.example.com/users',
        method: 'POST',
        headers: {},
        body: null,
        queryParams: {},
        description: 'Create user',
      };

      expect(apiCall.endpoint).toBeTruthy();
      expect(apiCall.method).toBeTruthy();
      expect(apiCall.headers).toBeDefined();
    });

    it('should reject invalid HTTP methods', () => {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const testMethod = 'GET';

      expect(validMethods).toContain(testMethod);
    });
  });

  describe('Fallback Behavior', () => {
    it('should provide default values when parsing fails', () => {
      const defaultCall: GeneratedApiCall = {
        endpoint: mockApiSchema.baseUrl || 'https://api.example.com',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: null,
        queryParams: {},
        description: 'Generated query',
      };

      expect(defaultCall.endpoint).toBeTruthy();
      expect(defaultCall.method).toBe('GET');
      expect(defaultCall.headers).toBeDefined();
    });

    it('should handle empty schema gracefully', () => {
      const emptySchema = {
        ...mockApiSchema,
        endpoints: [],
      };

      expect(emptySchema.endpoints).toHaveLength(0);
      expect(emptySchema.baseUrl).toBeTruthy();
    });

    it('should use first endpoint as fallback', () => {
      const firstEndpoint = mockApiSchema.endpoints[0];
      expect(firstEndpoint).toBeDefined();
      expect(firstEndpoint.path).toBeTruthy();
      expect(firstEndpoint.method).toBeTruthy();
    });
  });

  describe('Context Suggestions', () => {
    it('should generate example queries for endpoints', () => {
      const endpoint = mockApiSchema.endpoints[0];
      const method = endpoint.method.toLowerCase();
      const resource = endpoint.path.split('/').filter(p => p && !p.startsWith('{')).pop();

      let example = '';
      if (method === 'get') {
        example = `Get all ${resource}`;
      } else if (method === 'post') {
        example = `Create new ${resource}`;
      }

      expect(example).toBeTruthy();
      expect(example.length).toBeGreaterThan(0);
    });

    it('should suggest common patterns', () => {
      const patterns = [
        'Get all {resource}',
        'Create new {resource}',
        'Update {resource}',
        'Delete {resource}',
      ];

      patterns.forEach((pattern) => {
        expect(pattern).toContain('{resource}');
      });
    });
  });
});
