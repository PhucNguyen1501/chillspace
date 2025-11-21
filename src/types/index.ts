// API Schema Types
export type UUID = string;

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description?: string;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses?: Record<string, ApiResponse>;
  authentication?: AuthMethod[];
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  schema: {
    type: string;
    format?: string;
    enum?: string[];
    default?: any;
  };
  description?: string;
}

export interface ApiRequestBody {
  required?: boolean;
  content: Record<string, {
    schema: any;
    example?: any;
  }>;
}

export interface ApiResponse {
  description?: string;
  content?: Record<string, {
    schema: any;
    example?: any;
  }>;
}

export interface ApiSchema {
  id: UUID;
  url: string;
  title: string;
  version?: string;
  baseUrl?: string;
  endpoints: ApiEndpoint[];
  authMethods?: AuthMethod[];
  parsedAt: string;
}

// Authentication Types
export type AuthMethod = 
  | { type: 'apiKey'; name: string; in: 'header' | 'query' }
  | { type: 'bearer'; scheme?: string }
  | { type: 'oauth2'; flows: any }
  | { type: 'basic' };

export interface AuthConfig {
  method: AuthMethod;
  credentials: {
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
  };
}

// Query Types
export interface NaturalLanguageQuery {
  id: string;
  text: string;
  apiSchemaId: string;
  createdAt: string;
}

export interface GeneratedApiCall {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  queryParams?: Record<string, any>;
  body?: any;
  description?: string;
}

// Job Types
export interface Job {
  id: string;
  userId: string;
  name: string;
  query: GeneratedApiCall;
  schedule: JobSchedule;
  outputFormat: 'json' | 'csv' | 'xlsx';
  destination: JobDestination;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobSchedule {
  type: 'once' | 'hourly' | 'daily' | 'weekly' | 'cron';
  cronExpression?: string;
  nextRun?: string;
}

export interface JobDestination {
  type: 'supabase' | 'download' | 'webhook';
  tableName?: string;
  webhookUrl?: string;
  emailNotification?: boolean;
}

export interface JobRun {
  id: string;
  jobId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
  resultCount?: number;
}

// Storage Types
export interface ExtensionStorage {
  schemas: ApiSchema[];
  auth: Record<string, AuthConfig>;
  queries: NaturalLanguageQuery[];
  settings: {
    theme: 'light' | 'dark';
    supabaseUrl?: string;
    supabaseKey?: string;
    claudeApiKey?: string;
  };
}

// Parser Types
export interface ParsedDocumentation {
  type: 'openapi' | 'swagger' | 'graphql' | 'rest';
  schema: ApiSchema;
}

// Message Types for Chrome Extension Communication
export type MessageType = 
  | { type: 'PARSE_PAGE'; payload: { url: string } }
  | { type: 'PARSE_CURRENT_PAGE' }
  | { type: 'EXECUTE_QUERY'; payload: { query: GeneratedApiCall; auth?: AuthConfig } }
  | { type: 'SCHEDULE_JOB'; payload: Job }
  | { type: 'CANCEL_JOB'; payload: { jobId: string } }
  | { type: 'CONVERT_NL_QUERY'; payload: { text: string; schemaId: string } };

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
