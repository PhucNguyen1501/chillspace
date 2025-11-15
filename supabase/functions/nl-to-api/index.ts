// Supabase Edge Function for Natural Language to API conversion
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// @ts-ignore - Deno global
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY') || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const FUNCTION_TIMEOUT = 25000; // 25 seconds (Edge Functions have 30s limit)

if (!CLAUDE_API_KEY) {
  console.error('CLAUDE_API_KEY environment variable is not set');
}

interface NLRequest {
  query: string;
  schema: any;
}

// @ts-ignore - Deno serve function type
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('nl-to-api function called');
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const { query, schema }: NLRequest = requestBody;

    // Validate inputs
    if (!query || !schema) {
      console.error('Missing required fields:', { hasQuery: !!query, hasSchema: !!schema });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing query or schema' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Check if Claude API key is available
    if (!CLAUDE_API_KEY) {
      console.error('Claude API key not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Claude API key not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('Processing query:', query.substring(0, 50) + '...');
    console.log('Schema endpoints:', schema.endpoints?.length || 0);

    // Create enhanced system prompt with API schema context
    const systemPrompt = `You are an expert API query generator. Convert natural language queries into structured API calls.

API Schema Information:
- Base URL: ${schema.baseUrl || 'Not specified'}
- Title: ${schema.title || 'API Documentation'}
- Version: ${schema.version || 'Not specified'}

Available Endpoints:
${schema.endpoints.map((ep: any, index: number) => `
${index + 1}. ${ep.method} ${ep.path}
   Description: ${ep.description || 'No description'}
   Parameters: ${ep.parameters ? JSON.stringify(ep.parameters.map((p: any) => `${p.name} (${p.in}): ${p.description || 'No description'}`)) : 'None'}
   Responses: ${ep.responses ? Object.keys(ep.responses).join(', ') : 'None'}
`).join('\n')}

Instructions:
1. Analyze the user's natural language query
2. Match it to the most appropriate endpoint from the schema
3. Extract relevant parameters from the query
4. Generate a valid API call in the specified JSON format
5. Include only necessary parameters - don't make up values
6. For missing required parameters, use placeholder values like "example_value"

Response Format (JSON only):
{
  "endpoint": "full URL endpoint",
  "method": "GET|POST|PUT|PATCH|DELETE",
  "headers": { "Content-Type": "application/json", "Accept": "application/json" },
  "queryParams": { "param1": "value1" } (optional),
  "body": { "field1": "value1" } (optional for POST/PUT),
  "description": "Brief description of what this call does"
}

Examples:
Query: "Get all users" → {"endpoint": "https://api.example.com/users", "method": "GET", ...}
Query: "Create a new user with name John" → {"endpoint": "https://api.example.com/users", "method": "POST", "body": {"name": "John"}, ...}

IMPORTANT: Respond with ONLY the JSON object. No additional text, explanations, or markdown formatting.`;

    // Call Claude API with timeout and retry logic
    let claudeResponse;
    let retries = 2; // Reduced from 3 to fit in timeout
    let lastError;
    
    while (retries > 0) {
      try {
        console.log(`Calling Claude API (attempt ${3 - retries})`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FUNCTION_TIMEOUT / 2);
        
        try {
          claudeResponse = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': CLAUDE_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-5-haiku-20241022', // Using faster model
              max_tokens: 1024, // Reduced for faster response
              temperature: 0.1,
              messages: [
                {
                  role: 'user',
                  content: `${systemPrompt}\n\nUser query: "${query}"`,
                },
              ],
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (claudeResponse.ok) {
            console.log('Claude API call successful');
            break;
          }
          
          lastError = `Claude API returned status ${claudeResponse.status}: ${claudeResponse.statusText}`;
          console.error(lastError);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
        
        retries--;
        
        if (retries > 0) {
          console.log(`Retrying in ${(3 - retries) * 500}ms...`);
          await new Promise(resolve => setTimeout(resolve, (3 - retries) * 500));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error('Claude API error:', lastError);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, (3 - retries) * 500));
      }
    }

    if (!claudeResponse || !claudeResponse.ok) {
      const errorMsg = lastError || claudeResponse?.statusText || 'Unknown error';
      console.error('All Claude API attempts failed:', errorMsg);
      throw new Error(`Claude API error: ${errorMsg}`);
    }

    let claudeData;
    try {
      claudeData = await claudeResponse.json();
      console.log('Claude API response received');
    } catch (jsonError) {
      console.error('Failed to parse Claude API response:', jsonError);
      throw new Error('Invalid JSON response from Claude API');
    }
    
    if (!claudeData.content || !claudeData.content[0]?.text) {
      throw new Error('Invalid response from Claude API');
    }

    const generatedText = claudeData.content[0].text.trim();

    // Parse the generated API call
    let apiCall;
    try {
      // Clean up the response - remove any markdown formatting
      let cleanedText = generatedText;
      
      // Remove markdown code blocks if present
      if (cleanedText.startsWith('```')) {
        const lines = cleanedText.split('\n');
        lines.shift(); // Remove first line (```json)
        if (lines[lines.length - 1].startsWith('```')) {
          lines.pop(); // Remove last line (```)
        }
        cleanedText = lines.join('\n').trim();
      }

      // Parse JSON
      apiCall = JSON.parse(cleanedText);
      
      // Validate the structure
      if (!apiCall.endpoint || !apiCall.method || !apiCall.headers) {
        throw new Error('Invalid API call structure');
      }

      // Ensure required fields
      apiCall.endpoint = apiCall.endpoint.trim();
      apiCall.method = apiCall.method.toUpperCase();
      apiCall.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...apiCall.headers
      };
      
      // Add description if missing
      if (!apiCall.description) {
        apiCall.description = `Generated from query: "${query}"`;
      }

    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      console.error('Raw response:', generatedText);
      
      // Return a basic fallback structure
      apiCall = {
        endpoint: schema.baseUrl || 'https://api.example.com',
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        description: `Fallback for query: "${query}"`,
      };
    }

    console.log('Successfully generated API call');
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: apiCall,
      usage: claudeData.usage 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
    
  } catch (error) {
    console.error('Error in NL-to-API conversion:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
