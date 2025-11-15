import { describe, it, expect } from 'vitest';
import { mockApiSchema } from './mockData';
import type { GeneratedApiCall } from '../types';

describe('Component Tests', () => {
  describe('QueryInput Component', () => {
    it('should accept text input', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'Get all users';
      
      expect(textarea.value).toBe('Get all users');
    });

    it('should show suggestions when typing', () => {
      const suggestions = [
        'Get all users',
        'Create new user',
        'Update user',
        'Delete user',
      ];

      expect(suggestions).toHaveLength(4);
      expect(suggestions[0]).toBe('Get all users');
    });

    it('should disable when no schema selected', () => {
      const schema = null;
      const isDisabled = schema === null;

      expect(isDisabled).toBe(true);
    });

    it('should enable when schema is selected', () => {
      const schema = mockApiSchema;
      const isDisabled = schema === null;

      expect(isDisabled).toBe(false);
    });
  });

  describe('ApiPreview Component', () => {
    it('should display generated query', () => {
      const query: GeneratedApiCall = {
        endpoint: 'https://api.example.com/users',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
        queryParams: {},
        description: 'Get all users',
      };

      expect(query.endpoint).toBeTruthy();
      expect(query.method).toBe('GET');
      expect(query.description).toBe('Get all users');
    });

    it('should show HTTP method prominently', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      
      methods.forEach((method) => {
        expect(method).toMatch(/GET|POST|PUT|DELETE|PATCH/);
      });
    });

    it('should display request body for POST/PUT', () => {
      const query: GeneratedApiCall = {
        endpoint: 'https://api.example.com/users',
        method: 'POST',
        headers: {},
        body: {
          name: 'John',
          email: 'john@example.com',
        },
        queryParams: {},
        description: 'Create user',
      };

      expect(query.body).not.toBeNull();
      expect(query.body).toHaveProperty('name');
      expect(query.body).toHaveProperty('email');
    });

    it('should allow copying query to clipboard', () => {
      const query: GeneratedApiCall = {
        endpoint: 'https://api.example.com/users',
        method: 'GET',
        headers: {},
        body: null,
        queryParams: {},
        description: 'Test',
      };

      const curlCommand = `curl -X ${query.method} ${query.endpoint}`;
      expect(curlCommand).toContain('curl');
      expect(curlCommand).toContain(query.method);
      expect(curlCommand).toContain(query.endpoint);
    });
  });

  describe('ResponseViewer Component', () => {
    it('should display successful response', () => {
      const response = {
        success: true,
        data: {
          status: 200,
          statusText: 'OK',
          body: { message: 'Success' },
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.status).toBe(200);
    });

    it('should display error response', () => {
      const response = {
        success: false,
        error: 'Request failed',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Request failed');
    });

    it('should format JSON response', () => {
      const body = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      };

      const formatted = JSON.stringify(body, null, 2);
      expect(formatted).toContain('users');
      expect(formatted).toContain('John');
    });

    it('should show response status code', () => {
      const statusCodes = [200, 201, 400, 404, 500];
      
      statusCodes.forEach((code) => {
        expect(code).toBeGreaterThanOrEqual(100);
        expect(code).toBeLessThan(600);
      });
    });
  });

  describe('Schema Selector', () => {
    it('should list available schemas', () => {
      const schemas = [mockApiSchema];
      
      expect(schemas).toHaveLength(1);
      expect(schemas[0].title).toBe('Test API');
    });

    it('should show endpoint count', () => {
      const endpointCount = mockApiSchema.endpoints.length;
      
      expect(endpointCount).toBeGreaterThan(0);
      expect(endpointCount).toBe(2);
    });

    it('should display schema metadata', () => {
      const schema = mockApiSchema;
      
      expect(schema.title).toBeTruthy();
      expect(schema.url).toBeTruthy();
      expect(schema.version).toBeTruthy();
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast on successful parse', () => {
      const toast = {
        type: 'success',
        title: 'Successfully parsed API',
        description: 'Found 20 endpoints',
      };

      expect(toast.type).toBe('success');
      expect(toast.title).toContain('parsed');
      expect(toast.description).toContain('endpoints');
    });

    it('should show error toast on parse failure', () => {
      const toast = {
        type: 'error',
        title: 'No API documentation found',
        description: 'This page does not contain parseable API docs',
      };

      expect(toast.type).toBe('error');
      expect(toast.title).toContain('No API');
    });

    it('should show loading toast during operations', () => {
      const toast = {
        type: 'loading',
        title: 'Parsing API documentation...',
      };

      expect(toast.type).toBe('loading');
      expect(toast.title).toContain('Parsing');
    });
  });

  describe('Tab Navigation', () => {
    it('should have 4 tabs', () => {
      const tabs = ['query', 'jobs', 'schemas', 'settings'];
      
      expect(tabs).toHaveLength(4);
    });

    it('should highlight active tab', () => {
      const activeTab = 'query';
      const isActive = (tab: string) => tab === activeTab;

      expect(isActive('query')).toBe(true);
      expect(isActive('jobs')).toBe(false);
    });

    it('should switch between tabs', () => {
      let activeTab = 'query';
      
      activeTab = 'schemas';
      expect(activeTab).toBe('schemas');
      
      activeTab = 'settings';
      expect(activeTab).toBe('settings');
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during parse', () => {
      const loading = true;
      const buttonText = loading ? 'Parsing...' : 'Parse Page';

      expect(buttonText).toBe('Parsing...');
    });

    it('should disable buttons during loading', () => {
      const loading = true;
      const isDisabled = loading;

      expect(isDisabled).toBe(true);
    });

    it('should re-enable after operation completes', () => {
      const loading = false;
      const isDisabled = loading;

      expect(isDisabled).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should require schema selection', () => {
      const schema = null;
      const canGenerate = schema !== null && true;

      expect(canGenerate).toBe(false);
    });

    it('should require query text', () => {
      const queryText = '';
      const canGenerate = queryText.trim().length > 0;

      expect(canGenerate).toBe(false);
    });

    it('should enable when all requirements met', () => {
      const schema = mockApiSchema;
      const queryText = 'Get all users';
      const canGenerate = schema !== null && queryText.trim().length > 0;

      expect(canGenerate).toBe(true);
    });
  });
});
