import { ParsedDocumentation, ExtensionApiEndpoint } from '@/types/database'

export interface ClaudeApiRequest {
  apiSpec: ParsedDocumentation
  userIntent: string
  endpoint?: ExtensionApiEndpoint
  authType?: 'none' | 'bearer' | 'basic' | 'api_key'
  authData?: {
    token?: string
    username?: string
    password?: string
    apiKeyName?: string
    apiKeyValue?: string
  }
}

export interface GeneratedApiCall {
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  queryParams?: Record<string, string>
  description: string
  examples?: {
    request: any
    response: any
  }
}

export interface ClaudeApiResponse {
  success: boolean
  data?: GeneratedApiCall
  error?: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

class ClaudeService {
  private supabaseUrl: string
  private supabaseAnonKey: string

  constructor() {
    // Use Supabase Edge Functions
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
  }

  // Generate API call based on parsed documentation and user intent
  async generateApiCall(request: ClaudeApiRequest): Promise<ClaudeApiResponse> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-generate-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ClaudeApiResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error calling Claude API:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Generate natural language query for API endpoint
  async generateNaturalLanguageQuery(
    endpoint: ExtensionApiEndpoint,
    apiSpec: ParsedDocumentation,
    userGoal: string
  ): Promise<string> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-generate-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          endpoint,
          apiSpec,
          userGoal
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.query || 'Describe what you want to do with this API endpoint'
    } catch (error) {
      console.error('Error generating natural language query:', error)
      return 'Describe what you want to do with this API endpoint'
    }
  }

  // Explain API endpoint in natural language
  async explainEndpoint(
    endpoint: ExtensionApiEndpoint,
    apiSpec: ParsedDocumentation
  ): Promise<string> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-explain-endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          endpoint,
          apiSpec
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.explanation || endpoint.description || 'No description available'
    } catch (error) {
      console.error('Error explaining endpoint:', error)
      return endpoint.description || 'No description available'
    }
  }

  // Test API call with generated parameters
  async testApiCall(
    generatedCall: GeneratedApiCall,
    baseUrl: string
  ): Promise<{
    success: boolean
    status?: number
    data?: any
    error?: string
  }> {
    try {
      const fullUrl = new URL(generatedCall.url, baseUrl).href
      
      // Add query parameters
      let url = fullUrl
      if (generatedCall.queryParams && Object.keys(generatedCall.queryParams).length > 0) {
        const params = new URLSearchParams(generatedCall.queryParams)
        url = `${fullUrl}?${params.toString()}`
      }

      const response = await fetch(url, {
        method: generatedCall.method,
        headers: generatedCall.headers,
        body: generatedCall.body ? JSON.stringify(generatedCall.body) : undefined,
      })

      const data = await response.json()

      return {
        success: response.ok,
        status: response.status,
        data,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (error) {
      console.error('Error testing API call:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

export const claudeService = new ClaudeService()
