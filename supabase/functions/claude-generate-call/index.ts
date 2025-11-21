import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Define types inline for Deno compatibility
interface ClaudeApiRequest {
  apiSpec: {
    type: string
    schema: {
      id: string
      url: string
      title: string
      version?: string
      baseUrl?: string
      endpoints: any[]
      authMethods?: any[]
      parsedAt: string
    }
  }
  userIntent: string
  endpoint?: any
  authType?: string
  authData?: {
    token?: string
    username?: string
    password?: string
    apiKeyName?: string
    apiKeyValue?: string
  }
}

interface GeneratedApiCall {
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  queryParams?: Record<string, string>
  description: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { apiSpec, userIntent, endpoint, authType, authData }: ClaudeApiRequest = await req.json()

    if (!apiSpec || !userIntent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: apiSpec, userIntent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create prompt for Claude
    const prompt = createApiCallPrompt(apiSpec, userIntent, endpoint, authType, authData)
    
    // Call Claude API
    const claudeResponse = await callClaudeAPI(prompt)
    
    if (!claudeResponse.success) {
      return new Response(
        JSON.stringify(claudeResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse Claude's response
    const generatedCall = parseClaudeResponse(claudeResponse.data)
    
    const result = {
      success: true,
      data: generatedCall,
      usage: claudeResponse.usage
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating API call:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions
function createApiCallPrompt(apiSpec: any, userIntent: string, endpoint?: any, authType?: string, authData?: any): string {
  const baseUrl = apiSpec.schema.baseUrl || apiSpec.schema.url
  const endpoints = endpoint ? [endpoint] : apiSpec.schema.endpoints.slice(0, 5)
  
  let prompt = `You are an API expert. Based on the following API documentation and user intent, generate a complete API request.

API Documentation:
Title: ${apiSpec.schema.title}
Base URL: ${baseUrl}
Version: ${apiSpec.schema.version || '1.0.0'}

Available Endpoints:
${endpoints.map((ep: any) => `
- ${ep.method} ${ep.path}
  Description: ${ep.description || 'No description'}
  ${ep.parameters ? `Parameters: ${JSON.stringify(ep.parameters, null, 2)}` : ''}
  ${ep.requestBody ? `Request Body: ${JSON.stringify(ep.requestBody, null, 2)}` : ''}
`).join('')}

User Intent: "${userIntent}"
Authentication Type: ${authType || 'none'}
${authData ? `Auth Data: ${JSON.stringify(authData, null, 2)}` : ''}

Please generate a complete API request that fulfills the user's intent. Return your response in this exact JSON format:

{
  "method": "GET|POST|PUT|DELETE|PATCH",
  "url": "/endpoint/path",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token"
  },
  "queryParams": {
    "param1": "value1"
  },
  "body": {
    "key": "value"
  },
  "description": "What this API call does"
}

Rules:
1. Choose the most appropriate endpoint for the user's intent
2. Include all necessary headers based on the authentication type
3. Add query parameters and request body as needed
4. The URL should be relative to the base URL
5. If no suitable endpoint exists, suggest the closest match
6. Always return valid JSON`

  return prompt
}

async function callClaudeAPI(prompt: string): Promise<any> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('CLAUDE_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: data.content[0].text,
      usage: {
        input_tokens: data.usage.input_tokens,
        output_tokens: data.usage.output_tokens
      }
    }
  } catch (error) {
    console.error('Claude API error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

function parseClaudeResponse(claudeText: string): GeneratedApiCall {
  try {
    // Try to extract JSON from Claude's response
    const jsonMatch = claudeText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback if no JSON found
    return {
      method: 'GET',
      url: '/',
      headers: { 'Content-Type': 'application/json' },
      description: claudeText.substring(0, 200)
    }
  } catch (error) {
    console.error('Error parsing Claude response:', error)
    return {
      method: 'GET',
      url: '/',
      headers: { 'Content-Type': 'application/json' },
      description: 'Error parsing response'
    }
  }
}
