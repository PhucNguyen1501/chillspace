-- ChillSpace Database Schema - FRESH START
-- This script drops all existing tables and recreates everything
-- WARNING: This will delete all existing data!

-- ==============================================
-- CLEANUP - Drop everything first
-- ==============================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_api_connections_updated_at ON api_connections;

-- Drop all tables in correct order (considering foreign key dependencies)
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS usage_analytics CASCADE;
DROP TABLE IF EXISTS execution_history CASCADE;
DROP TABLE IF EXISTS scheduled_jobs CASCADE;
DROP TABLE IF EXISTS saved_queries CASCADE;
DROP TABLE IF EXISTS api_endpoints CASCADE;
DROP TABLE IF EXISTS api_connections CASCADE;
DROP TABLE IF EXISTS email_captures CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.validate_email_format() CASCADE;

-- ==============================================
-- TABLES - Recreate from scratch
-- ==============================================

-- Email captures from landing page and signups
CREATE TABLE email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('hero', 'cta', 'signup')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_captures_email_unique UNIQUE (email)
);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API connections and endpoints
CREATE TABLE api_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('none', 'bearer', 'basic', 'api_key', 'oauth2')),
  auth_headers JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API endpoints extracted from documentation
CREATE TABLE api_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES api_connections(id) ON DELETE CASCADE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  path TEXT NOT NULL,
  description TEXT,
  parameters JSONB DEFAULT '{}',
  response_schema JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved queries and templates
CREATE TABLE saved_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES api_connections(id) ON DELETE CASCADE NOT NULL,
  endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  natural_language_query TEXT NOT NULL,
  generated_request JSONB NOT NULL,
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled data extraction jobs
CREATE TABLE scheduled_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  query_id UUID REFERENCES saved_queries(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once', 'hourly', 'daily', 'weekly', 'monthly', 'custom')),
  schedule_config JSONB DEFAULT '{}',
  export_format TEXT NOT NULL CHECK (export_format IN ('json', 'csv', 'xlsx')),
  export_destination JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Execution history and results
CREATE TABLE execution_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  query_id UUID REFERENCES saved_queries(id) ON DELETE SET NULL,
  job_id UUID REFERENCES scheduled_jobs(id) ON DELETE SET NULL,
  request_url TEXT NOT NULL,
  request_method TEXT NOT NULL,
  request_headers JSONB DEFAULT '{}',
  request_body TEXT,
  response_status INTEGER,
  response_headers JSONB DEFAULT '{}',
  response_body TEXT,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage analytics
CREATE TABLE usage_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team management (for future features)
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES
-- ==============================================

CREATE INDEX idx_email_captures_email ON email_captures(email);
CREATE INDEX idx_email_captures_source ON email_captures(source);
CREATE INDEX idx_email_captures_created_at ON email_captures(created_at);

CREATE INDEX idx_api_connections_user_id ON api_connections(user_id);
CREATE INDEX idx_api_endpoints_connection_id ON api_endpoints(connection_id);
CREATE INDEX idx_saved_queries_user_id ON saved_queries(user_id);
CREATE INDEX idx_saved_queries_connection_id ON saved_queries(connection_id);
CREATE INDEX idx_scheduled_jobs_user_id ON scheduled_jobs(user_id);
CREATE INDEX idx_scheduled_jobs_is_active ON scheduled_jobs(is_active);
CREATE INDEX idx_execution_history_user_id ON execution_history(user_id);
CREATE INDEX idx_execution_history_created_at ON execution_history(created_at);
CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_created_at ON usage_analytics(created_at);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email_format(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if profile already exists to avoid duplicates
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = new.id
  ) THEN
    INSERT INTO profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      NOW(),
      NOW()
    );
  END IF;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_connections_updated_at BEFORE UPDATE ON api_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- CONSTRAINTS
-- ==============================================

-- Add email format validation
ALTER TABLE email_captures 
ADD CONSTRAINT valid_email_format 
CHECK (validate_email_format(email));

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Email Captures: Allow anyone to insert (for landing page)
CREATE POLICY "Anyone can insert email captures" ON email_captures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read email captures" ON email_captures
  FOR SELECT USING (true);

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- API Connections: Users can only access their own connections
CREATE POLICY "Users can view own API connections" ON api_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API connections" ON api_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API connections" ON api_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API connections" ON api_connections
  FOR DELETE USING (auth.uid() = user_id);

-- API Endpoints: Users can access endpoints for their connections
CREATE POLICY "Users can view own API endpoints" ON api_endpoints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM api_connections
      WHERE api_connections.id = api_endpoints.connection_id
      AND api_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own API endpoints" ON api_endpoints
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM api_connections
      WHERE api_connections.id = connection_id
      AND api_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own API endpoints" ON api_endpoints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM api_connections
      WHERE api_connections.id = api_endpoints.connection_id
      AND api_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own API endpoints" ON api_endpoints
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM api_connections
      WHERE api_connections.id = api_endpoints.connection_id
      AND api_connections.user_id = auth.uid()
    )
  );

-- Saved Queries: Users can only access their own queries
CREATE POLICY "Users can view own saved queries" ON saved_queries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved queries" ON saved_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved queries" ON saved_queries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved queries" ON saved_queries
  FOR DELETE USING (auth.uid() = user_id);

-- Scheduled Jobs: Users can only access their own jobs
CREATE POLICY "Users can view own scheduled jobs" ON scheduled_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled jobs" ON scheduled_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled jobs" ON scheduled_jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled jobs" ON scheduled_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Execution History: Users can only access their own history
CREATE POLICY "Users can view own execution history" ON execution_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own execution history" ON execution_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage Analytics: Users can only access their own analytics
CREATE POLICY "Users can view own usage analytics" ON usage_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage analytics" ON usage_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Team Members: Users can view their team memberships
CREATE POLICY "Users can view own team memberships" ON team_members
  FOR SELECT USING (auth.uid() = member_id OR auth.uid() = team_id);

CREATE POLICY "Team owners can insert team members" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Team owners can delete team members" ON team_members
  FOR DELETE USING (auth.uid() = team_id);

-- ==============================================
-- PERMISSIONS
-- ==============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE 'Fresh database schema created successfully!';
  RAISE NOTICE 'All tables, indexes, functions, triggers, and policies have been recreated.';
  RAISE NOTICE 'You can now use the ChillSpace web application.';
END $$;
