import type { ApiSchema, GeneratedApiCall } from '../types';
import { supabase } from './supabase';

/**
 * Convert natural language query to API call using Claude API
 */
export async function convertNaturalLanguageToApi(
  query: string,
  schema: ApiSchema
): Promise<GeneratedApiCall> {
  console.log('[NLP] Starting conversion for query:', query.substring(0, 50));
  console.log('[NLP] Schema:', schema.title, 'with', schema.endpoints?.length, 'endpoints');
  
  try {
    // Call the Supabase Edge Function for NL-to-API conversion
    console.log('[NLP] Calling Supabase Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('nl-to-api', {
      body: { query, schema }
    });

    console.log('[NLP] Edge Function response:', { success: data?.success, hasError: !!error });

    if (error) {
      console.error('[NLP] Edge Function error:', {
        message: error.message,
        context: error.context,
        details: error
      });
      throw new Error(`Failed to call Edge Function: ${error.message}`);
    }

    if (!data) {
      console.error('[NLP] No data returned from Edge Function');
      throw new Error('No data returned from Edge Function');
    }

    if (!data.success) {
      console.error('[NLP] Edge Function returned error:', data.error);
      throw new Error(data.error || 'Unknown error from Edge Function');
    }

    if (!data.data) {
      console.error('[NLP] Edge Function returned success but no data');
      throw new Error('No API call data returned');
    }

    console.log('[NLP] Successfully generated API call:', data.data.method, data.data.endpoint);
    return data.data as GeneratedApiCall;
  } catch (error) {
    console.error('[NLP] Error in NL-to-API conversion:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name
    });
    
    console.log('[NLP] Falling back to simple pattern matching');
    // Fallback to basic pattern matching if Claude API fails
    return parseSimpleQuery(query, schema);
  }
}

/**
 * Enhanced simple pattern matching as fallback
 */
function parseSimpleQuery(query: string, schema: ApiSchema): GeneratedApiCall {
  const lowerQuery = query.toLowerCase();
  
  // Determine HTTP method
  let method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET';
  if (lowerQuery.includes('create') || lowerQuery.includes('add') || lowerQuery.includes('new')) {
    method = 'POST';
  } else if (lowerQuery.includes('update') || lowerQuery.includes('modify') || lowerQuery.includes('change')) {
    method = 'PUT';
  } else if (lowerQuery.includes('delete') || lowerQuery.includes('remove')) {
    method = 'DELETE';
  } else if (lowerQuery.includes('patch')) {
    method = 'PATCH';
  }

  // Find best matching endpoint
  let endpoint = schema.baseUrl || 'https://api.example.com';
  let matchedEndpoint = null;
  
  // Score endpoints based on keyword matches
  let bestScore = 0;
  for (const ep of schema.endpoints) {
    if (ep.method === method) {
      let score = 0;
      const pathWords = ep.path.toLowerCase().split('/').filter(w => w && w !== '{' && w !== '}');
      const queryWords = lowerQuery.split(' ').filter(w => w.length > 2);
      
      // Calculate match score
      pathWords.forEach(pathWord => {
        queryWords.forEach(queryWord => {
          if (pathWord.includes(queryWord) || queryWord.includes(pathWord)) {
            score += 2;
          }
        });
      });
      
      // Bonus for exact matches
      if (pathWords.some(pw => queryWords.includes(pw))) {
        score += 5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        matchedEndpoint = ep;
      }
    }
  }
  
  if (matchedEndpoint) {
    endpoint = `${schema.baseUrl || ''}${matchedEndpoint.path}`;
  }

  // Generate basic headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Try to extract body parameters for POST/PUT requests
  let body: Record<string, any> | null = null;
  if ((method === 'POST' || method === 'PUT') && matchedEndpoint?.requestBody) {
    body = {};
    // Extract potential body parameters from query
    const queryWords = query.toLowerCase().split(' ');
    
    // For POST requests, try to extract entities from the query
    if (method === 'POST') {
      // Simple heuristic: look for nouns that could be data
      const potentialData = queryWords.filter(word => 
        word.length > 3 && 
        !['get', 'create', 'new', 'add', 'post', 'put', 'update', 'delete'].includes(word)
      );
      
      if (potentialData.length > 0) {
        // Create a simple body structure
        body = {
          name: potentialData[0],
          // Add other potential fields based on common patterns
          ...(query.toLowerCase().includes('email') && { email: 'example@email.com' }),
          ...(query.toLowerCase().includes('password') && { password: 'password123' }),
          ...(query.toLowerCase().includes('title') && { title: potentialData[0] }),
        };
      }
    }
    
    // If no body found, create empty object for POST requests
    if (Object.keys(body).length === 0 && method === 'POST') {
      body = {};
    }
  }

  return {
    endpoint,
    method,
    headers,
    body,
    queryParams: {},
    description: `Generated from: "${query}"`,
  };
}

/**
 * Validate generated API call against schema
 */
export function validateApiCall(call: GeneratedApiCall, schema: ApiSchema): boolean {
  // Check if endpoint exists in schema
  const endpointExists = schema.endpoints.some(ep => 
    ep.method === call.method && 
    `${schema.baseUrl || ''}${ep.path}` === call.endpoint
  );
  
  if (!endpointExists) {
    console.warn('Generated endpoint not found in schema:', call.endpoint);
    return false;
  }
  
  // Basic validation
  return !!call.endpoint && !!call.method && !!call.headers;
}

/**
 * Get query suggestions based on schema
 */
export function getQuerySuggestions(schema: ApiSchema): string[] {
  const suggestions: string[] = [];
  
  schema.endpoints.forEach(endpoint => {
    const pathParts = endpoint.path.split('/').filter(p => p && !p.startsWith('{'));
    const resource = pathParts[pathParts.length - 1] || 'data';
    
    switch (endpoint.method) {
      case 'GET':
        if (pathParts.length === 1) {
          suggestions.push(`Get all ${resource}`);
          suggestions.push(`List ${resource}`);
        } else {
          suggestions.push(`Get ${resource} details`);
          suggestions.push(`Find ${resource} by ID`);
        }
        break;
      case 'POST':
        suggestions.push(`Create new ${resource}`);
        suggestions.push(`Add ${resource}`);
        break;
      case 'PUT':
        suggestions.push(`Update ${resource}`);
        suggestions.push(`Modify ${resource}`);
        break;
      case 'DELETE':
        suggestions.push(`Delete ${resource}`);
        suggestions.push(`Remove ${resource}`);
        break;
    }
  });
  
  // Remove duplicates and limit to 10 suggestions
  return [...new Set(suggestions)].slice(0, 10);
}
