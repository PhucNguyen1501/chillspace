import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { endpoint, apiSpec } = await req.json()

    if (!endpoint || !apiSpec) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: endpoint, apiSpec' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `Explain this API endpoint in simple terms for a developer:

Endpoint: ${endpoint.method} ${endpoint.path}
Description: ${endpoint.description || 'No description'}
${endpoint.parameters ? `Parameters: ${JSON.stringify(endpoint.parameters, null, 2)}` : ''}
${endpoint.requestBody ? `Request Body: ${JSON.stringify(endpoint.requestBody, null, 2)}` : ''}
${endpoint.responses ? `Responses: ${JSON.stringify(endpoint.responses, null, 2)}` : ''}

Provide a clear explanation of:
1. What this endpoint does
2. When to use it
3. What parameters are required
4. What to expect in the response

Keep it concise and developer-friendly.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('CLAUDE_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
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
    const explanation = data.content[0].text.trim()

    return new Response(
      JSON.stringify({ explanation }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error explaining endpoint:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
