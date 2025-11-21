import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory storage for parsed docs (in production, use Supabase database)
let parsedDocs: any[] = []

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const method = req.method
  const path = url.pathname

  try {
    // GET /functions/v1/extension-parsed-docs - Get unprocessed docs
    if (method === 'GET' && path === '/extension-parsed-docs') {
      const unprocessed = parsedDocs.filter(doc => !doc.processed)
      return new Response(
        JSON.stringify(unprocessed),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /functions/v1/extension-parsed-docs - Save parsed docs
    if (method === 'POST' && path === '/extension-parsed-docs') {
      const { docs } = await req.json()
      
      if (!Array.isArray(docs)) {
        return new Response(
          JSON.stringify({ error: 'Docs must be an array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Add metadata to docs
      const docsWithMetadata = docs.map(doc => ({
        ...doc,
        id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: doc.timestamp || Date.now(),
        processed: doc.processed !== undefined ? doc.processed : false
      }))

      parsedDocs.push(...docsWithMetadata)
      
      console.log(`Received ${docsWithMetadata.length} parsed docs from extension`)
      
      return new Response(
        JSON.stringify({ success: true, count: docsWithMetadata.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /functions/v1/extension-parsed-docs/{id}/process - Mark as processed
    if (method === 'POST' && path.match(/^\/extension-parsed-docs\/[^\/]+\/process$/)) {
      const docId = path.split('/')[2]
      const doc = parsedDocs.find(d => d.id === docId)
      
      if (!doc) {
        return new Response(
          JSON.stringify({ error: 'Document not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      doc.processed = true
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /functions/v1/extension-parsed-docs - Clear all docs
    if (method === 'DELETE' && path === '/extension-parsed-docs') {
      parsedDocs = []
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /functions/v1/extension-parsed-docs/count - Get unprocessed count
    if (method === 'GET' && path === '/extension-parsed-docs/count') {
      const count = parsedDocs.filter(doc => !doc.processed).length
      return new Response(
        JSON.stringify({ count }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /functions/v1/extension-parsed-docs/health - Health check
    if (method === 'GET' && path === '/extension-parsed-docs/health') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          docs: parsedDocs.length
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Extension API error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
