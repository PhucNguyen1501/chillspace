export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company?: string
  role?: string
  created_at: string
  updated_at: string
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
export type ScheduleType = 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
export type ExportFormat = 'json' | 'csv' | 'xlsx'

export interface ApiConnection {
  id: string
  user_id: string
  name: string
  base_url: string
  auth_type: AuthType
  auth_headers?: Record<string, any>
  description?: string
  created_at: string
  updated_at: string
}

export interface ApiEndpoint {
  id: string
  connection_id: string
  method: HttpMethod
  path: string
  description?: string
  parameters?: Record<string, any>
  response_schema?: Record<string, any>
  created_at: string
}

export interface SavedQuery {
  id: string
  user_id: string
  connection_id: string
  endpoint_id?: string
  name: string
  natural_language_query: string
  generated_request: Record<string, any>
  parameters?: Record<string, any>
  created_at: string
  last_used?: string
}

export interface ScheduledJob {
  id: string
  user_id: string
  query_id: string
  name: string
  schedule_type: ScheduleType
  schedule_config?: Record<string, any>
  export_format: ExportFormat
  export_destination?: Record<string, any>
  is_active: boolean
  last_run?: string
  next_run?: string
  created_at: string
}

export interface ExecutionHistory {
  id: string
  user_id: string
  query_id?: string
  job_id?: string
  request_url: string
  request_method: string
  request_headers?: Record<string, any>
  request_body?: string
  response_status?: number
  response_headers?: Record<string, any>
  response_body?: string
  execution_time_ms?: number
  success: boolean
  error_message?: string
  created_at: string
}

export interface UsageAnalytics {
  id: string
  user_id: string
  event_type: string
  event_data?: Record<string, any>
  created_at: string
}

export interface EmailCapture {
  id?: string
  email: string
  source: 'hero' | 'cta' | 'signup'
  created_at?: string
}

// Chrome Extension Types (for API documentation parsing)
export interface ExtensionApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  description?: string
  parameters?: ExtensionApiParameter[]
  requestBody?: ExtensionApiRequestBody
  responses?: Record<string, ExtensionApiResponse>
  authentication?: ExtensionAuthMethod[]
}

export interface ExtensionApiParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required?: boolean
  schema: {
    type: string
    format?: string
    enum?: string[]
    default?: any
  }
  description?: string
}

export interface ExtensionApiRequestBody {
  required?: boolean
  content: Record<string, {
    schema: any
    example?: any
  }>
}

export interface ExtensionApiResponse {
  description?: string
  content?: Record<string, {
    schema: any
    example?: any
  }>
}

export type ExtensionAuthMethod = 
  | { type: 'apiKey'; name: string; in: 'header' | 'query' }
  | { type: 'bearer'; scheme?: string }
  | { type: 'oauth2'; flows: any }
  | { type: 'basic' }

export interface ExtensionApiSchema {
  id: string
  url: string
  title: string
  version?: string
  baseUrl?: string
  endpoints: ExtensionApiEndpoint[]
  authMethods?: ExtensionAuthMethod[]
  parsedAt: string
}

export interface ParsedDocumentation {
  type: 'openapi' | 'swagger' | 'graphql' | 'rest'
  schema: ExtensionApiSchema
}
