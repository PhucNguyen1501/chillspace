import { supabase } from './supabase';
import type { ApiSchema, GeneratedApiCall } from '../types';
import { toast } from 'sonner';

export class DataSyncService {
  private static instance: DataSyncService;
  
  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  /**
   * Save schema to both local storage and Supabase (if authenticated)
   */
  async saveSchema(schema: ApiSchema, userId?: string): Promise<void> {
    try {
      // Always save to local storage as backup
      await this.saveSchemaToLocal(schema);
      
      // If user is authenticated, also save to Supabase
      if (userId) {
        await this.saveSchemaToSupabase(schema, userId);
        toast.success('Schema saved to cloud', {
          description: `${schema.title} is now synced across your devices`,
        });
      } else {
        toast.success('Schema saved locally', {
          description: 'Sign in to sync across devices',
        });
      }
    } catch (error) {
      console.error('Error saving schema:', error);
      toast.error('Failed to save schema', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Load schemas from Supabase (if authenticated) or local storage
   */
  async loadSchemas(userId?: string): Promise<ApiSchema[]> {
    try {
      if (userId) {
        // Try to load from Supabase first
        const supabaseSchemas = await this.loadSchemasFromSupabase(userId);
        if (supabaseSchemas.length > 0) {
          // Also update local storage with latest from cloud
          await this.saveSchemasToLocal(supabaseSchemas);
          return supabaseSchemas;
        }
      }
      
      // Fallback to local storage
      return await this.loadSchemasFromLocal();
    } catch (error) {
      console.error('Error loading schemas:', error);
      toast.error('Failed to load schemas', {
        description: 'Using local storage only',
      });
      return await this.loadSchemasFromLocal();
    }
  }

  /**
   * Delete schema from both local storage and Supabase
   */
  async deleteSchema(schemaId: string, userId?: string): Promise<void> {
    try {
      // Delete from local storage
      await this.deleteSchemaFromLocal(schemaId);
      
      // Delete from Supabase if authenticated
      if (userId) {
        await this.deleteSchemaFromSupabase(schemaId, userId);
        toast.success('Schema deleted from cloud');
      } else {
        toast.success('Schema deleted locally');
      }
    } catch (error) {
      console.error('Error deleting schema:', error);
      toast.error('Failed to delete schema', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Save query execution to Supabase (if authenticated)
   */
  async saveQuery(query: string, generatedQuery: GeneratedApiCall, response: any, userId?: string): Promise<void> {
    try {
      if (userId) {
        await this.saveQueryToSupabase(query, generatedQuery, response, userId);
        toast.success('Query saved to cloud', {
          description: 'Your query history is synced across devices',
        });
      } else {
        toast.success('Query saved locally', {
          description: 'Sign in to sync query history',
        });
        await this.saveQueryToLocal(query, generatedQuery, response);
      }
    } catch (error) {
      console.error('Error saving query:', error);
      toast.error('Failed to save query', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Load query history from Supabase or local storage
   */
  async loadQueryHistory(userId?: string): Promise<any[]> {
    try {
      if (userId) {
        const supabaseQueries = await this.loadQueriesFromSupabase(userId);
        if (supabaseQueries.length > 0) {
          return supabaseQueries;
        }
      }
      return await this.loadQueriesFromLocal();
    } catch (error) {
      console.error('Error loading query history:', error);
      return await this.loadQueriesFromLocal();
    }
  }

  // Local Storage Methods
  private async saveSchemaToLocal(schema: ApiSchema): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['schemas'], (result) => {
        const schemas = result.schemas || [];
        const existingIndex = schemas.findIndex((s: ApiSchema) => s.id === schema.id);
        
        if (existingIndex >= 0) {
          schemas[existingIndex] = schema;
        } else {
          schemas.push(schema);
        }
        
        chrome.storage.local.set({ schemas }, resolve);
      });
    });
  }

  private async saveSchemasToLocal(schemas: ApiSchema[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ schemas }, resolve);
    });
  }

  private async loadSchemasFromLocal(): Promise<ApiSchema[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['schemas'], (result) => {
        resolve(result.schemas || []);
      });
    });
  }

  private async deleteSchemaFromLocal(schemaId: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['schemas'], (result) => {
        const schemas = result.schemas || [];
        const filteredSchemas = schemas.filter((s: ApiSchema) => s.id !== schemaId);
        chrome.storage.local.set({ schemas: filteredSchemas }, resolve);
      });
    });
  }

  private async saveQueryToLocal(query: string, generatedQuery: GeneratedApiCall, response: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['queryHistory'], (result) => {
        const history = result.queryHistory || [];
        history.unshift({
          id: Date.now().toString(),
          query,
          generatedQuery,
          response,
          timestamp: new Date().toISOString(),
        });
        
        // Keep only last 100 queries locally
        const trimmedHistory = history.slice(0, 100);
        chrome.storage.local.set({ queryHistory: trimmedHistory }, resolve);
      });
    });
  }

  private async loadQueriesFromLocal(): Promise<any[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['queryHistory'], (result) => {
        resolve(result.queryHistory || []);
      });
    });
  }

  // Supabase Methods
  private async saveSchemaToSupabase(schema: ApiSchema, userId: string): Promise<void> {
    const { error } = await supabase.from('api_schemas').upsert({
      user_id: userId,
      id: schema.id,
      url: schema.url,
      title: schema.title,
      version: schema.version,
      base_url: schema.baseUrl,
      schema_data: schema,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  private async loadSchemasFromSupabase(userId: string): Promise<ApiSchema[]> {
    const { data, error } = await supabase
      .from('api_schemas')
      .select('schema_data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    return data?.map(item => item.schema_data as ApiSchema) || [];
  }

  private async deleteSchemaFromSupabase(schemaId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('api_schemas')
      .delete()
      .eq('id', schemaId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  private async saveQueryToSupabase(query: string, generatedQuery: GeneratedApiCall, response: any, userId: string): Promise<void> {
    const { error } = await supabase.from('queries').insert({
      user_id: userId,
      natural_language: query,
      generated_query: generatedQuery,
      response_data: response,
    });

    if (error) throw error;
  }

  private async loadQueriesFromSupabase(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    return data?.map(item => ({
      id: item.id,
      query: item.natural_language,
      generatedQuery: item.generated_query,
      response: item.response_data,
      timestamp: item.created_at,
    })) || [];
  }

  /**
   * Clear all local data (for sign out)
   */
  async clearLocalData(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  }

  /**
   * Sync local data to Supabase when user signs in
   */
  async syncLocalToSupabase(userId: string): Promise<void> {
    try {
      // Sync schemas
      const localSchemas = await this.loadSchemasFromLocal();
      for (const schema of localSchemas) {
        await this.saveSchemaToSupabase(schema, userId);
      }

      // Sync query history
      const localQueries = await this.loadQueriesFromLocal();
      for (const queryItem of localQueries) {
        await this.saveQueryToSupabase(
          queryItem.query,
          queryItem.generatedQuery,
          queryItem.response,
          userId
        );
      }

      toast.success('Data synced to cloud', {
        description: `Synced ${localSchemas.length} schemas and ${localQueries.length} queries`,
      });
    } catch (error) {
      console.error('Error syncing local data:', error);
      toast.error('Failed to sync some data', {
        description: 'Your local data is preserved',
      });
    }
  }
}
