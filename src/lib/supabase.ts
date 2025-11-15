import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      api_schemas: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          title: string;
          version: string | null;
          base_url: string | null;
          schema_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['api_schemas']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['api_schemas']['Insert']>;
      };
      queries: {
        Row: {
          id: string;
          user_id: string;
          api_schema_id: string;
          natural_language: string;
          generated_query: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['queries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['queries']['Insert']>;
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          query: any;
          schedule: any;
          output_format: string;
          destination: any;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
      job_runs: {
        Row: {
          id: string;
          job_id: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          error: string | null;
          result_count: number | null;
        };
        Insert: Omit<Database['public']['Tables']['job_runs']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['job_runs']['Insert']>;
      };
      extracted_data: {
        Row: {
          id: string;
          job_run_id: string;
          data: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['extracted_data']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['extracted_data']['Insert']>;
      };
    };
  };
}

// Helper functions
export async function saveApiSchema(schema: Database['public']['Tables']['api_schemas']['Insert']) {
  const { data, error } = await supabase
    .from('api_schemas')
    .insert(schema)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getApiSchemas(userId: string) {
  const { data, error } = await supabase
    .from('api_schemas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function saveQuery(query: Database['public']['Tables']['queries']['Insert']) {
  const { data, error } = await supabase
    .from('queries')
    .insert(query)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createJob(job: Database['public']['Tables']['jobs']['Insert']) {
  const { data, error } = await supabase
    .from('jobs')
    .insert(job)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getJobs(userId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function logJobRun(jobRun: Database['public']['Tables']['job_runs']['Insert']) {
  const { data, error } = await supabase
    .from('job_runs')
    .insert(jobRun)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateJobRun(id: string, update: Database['public']['Tables']['job_runs']['Update']) {
  const { data, error } = await supabase
    .from('job_runs')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function saveExtractedData(data: Database['public']['Tables']['extracted_data']['Insert']) {
  const { data: result, error } = await supabase
    .from('extracted_data')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}
