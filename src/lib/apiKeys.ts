import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  name: string;
  type: 'bearer' | 'apikey' | 'basic';
  value: string;
  headerName?: string; // For apikey type (e.g., 'X-API-Key')
  domain?: string; // Optional domain restriction
  createdAt: string;
}

export class ApiKeysService {
  private static instance: ApiKeysService;
  private readonly STORAGE_KEY = 'chillspace_api_keys';

  static getInstance(): ApiKeysService {
    if (!ApiKeysService.instance) {
      ApiKeysService.instance = new ApiKeysService();
    }
    return ApiKeysService.instance;
  }

  /**
   * Get all stored API keys
   */
  async getApiKeys(): Promise<ApiKey[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || [];
    } catch (error) {
      console.error('Error loading API keys:', error);
      return [];
    }
  }

  /**
   * Save an API key
   */
  async saveApiKey(apiKey: Omit<ApiKey, 'id' | 'createdAt'>): Promise<ApiKey> {
    try {
      const keys = await this.getApiKeys();
      const newKey: ApiKey = {
        ...apiKey,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      keys.push(newKey);
      await chrome.storage.local.set({ [this.STORAGE_KEY]: keys });

      toast.success('API key saved', {
        description: `${apiKey.name} has been added to your keys`,
      });

      return newKey;
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
      throw error;
    }
  }

  /**
   * Update an existing API key
   */
  async updateApiKey(id: string, updates: Partial<Omit<ApiKey, 'id' | 'createdAt'>>): Promise<ApiKey> {
    try {
      const keys = await this.getApiKeys();
      const index = keys.findIndex(key => key.id === id);
      
      if (index === -1) {
        throw new Error('API key not found');
      }

      keys[index] = { ...keys[index], ...updates };
      await chrome.storage.local.set({ [this.STORAGE_KEY]: keys });

      toast.success('API key updated', {
        description: `${keys[index].name} has been updated`,
      });

      return keys[index];
    } catch (error) {
      console.error('Error updating API key:', error);
      toast.error('Failed to update API key');
      throw error;
    }
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string): Promise<void> {
    try {
      const keys = await this.getApiKeys();
      const filteredKeys = keys.filter(key => key.id !== id);
      
      await chrome.storage.local.set({ [this.STORAGE_KEY]: filteredKeys });

      toast.success('API key deleted', {
        description: 'The API key has been removed',
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
      throw error;
    }
  }

  /**
   * Get appropriate auth headers for a URL
   */
  async getAuthHeaders(url: string): Promise<Record<string, string>> {
    try {
      const keys = await this.getApiKeys();
      
      // Find a key that matches this URL (if domain is specified)
      const matchingKey = keys.find(key => {
        if (!key.domain) return false;
        return url.includes(key.domain);
      });

      if (!matchingKey) return {};

      switch (matchingKey.type) {
        case 'bearer':
          return { Authorization: `Bearer ${matchingKey.value}` };
        
        case 'apikey':
          return { [matchingKey.headerName || 'X-API-Key']: matchingKey.value };
        
        case 'basic':
          const encoded = btoa(matchingKey.value); // value should be "username:password"
          return { Authorization: `Basic ${encoded}` };
        
        default:
          return {};
      }
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {};
    }
  }

  /**
   * Get API key by ID
   */
  async getApiKey(id: string): Promise<ApiKey | null> {
    try {
      const keys = await this.getApiKeys();
      return keys.find(key => key.id === id) || null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: Omit<ApiKey, 'id' | 'createdAt'>): string[] {
    const errors: string[] = [];

    if (!apiKey.name.trim()) {
      errors.push('Name is required');
    }

    if (!apiKey.value.trim()) {
      errors.push('API key value is required');
    }

    if (apiKey.type === 'apikey' && !apiKey.headerName?.trim()) {
      errors.push('Header name is required for API key type');
    }

    if (apiKey.domain && !this.isValidDomain(apiKey.domain)) {
      errors.push('Invalid domain format');
    }

    return errors;
  }

  /**
   * Simple domain validation
   */
  private isValidDomain(domain: string): boolean {
    try {
      new URL(domain);
      return true;
    } catch {
      // Try parsing as hostname
      return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
    }
  }

  /**
   * Clear all API keys (for testing/reset)
   */
  async clearAllApiKeys(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
      toast.success('All API keys cleared');
    } catch (error) {
      console.error('Error clearing API keys:', error);
      toast.error('Failed to clear API keys');
    }
  }
}
