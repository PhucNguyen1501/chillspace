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
    const { endpoint, apiSpec, userGoal } = await req.json()

    if (!endpoint || !apiSpec || !userGoal) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: endpoint, apiSpec, userGoal' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `Given this API endpoint and user goal, generate a natural language description of what the user wants to do:

Endpoint: ${endpoint.method} ${endpoint.path}
Description: ${endpoint.description || 'No description'}
API: ${apiSpec.schema.title}

User Goal: "${userGoal}"

Generate a clear, specific natural language query that describes what API call the user wants to make. For example:
- "Get all users with role 'admin' created in the last 7 days"
- "Create a new product with name 'iPhone 15' and price 999"
- "Update order #12345 status to 'shipped'"

Query:`

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
    const query = data.content[0].text.trim()

    return new Response(
      JSON.stringify({ query }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating query:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
