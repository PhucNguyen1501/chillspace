-- Test script to verify database setup
-- Run this in Supabase SQL Editor to check if everything is working

-- Check if tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'email_captures', 'api_connections', 'api_endpoints', 'saved_queries', 'scheduled_jobs', 'execution_history', 'usage_analytics', 'team_members')
ORDER BY table_name;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'email_captures', 'api_connections', 'api_endpoints', 'saved_queries', 'scheduled_jobs', 'execution_history', 'usage_analytics', 'team_members')
ORDER BY tablename;

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT routine_name, routine_type, routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- First check if profiles table has the correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Inspect profiles table structure (read-only)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- IMPORTANT: Do NOT insert into profiles here.
-- profiles.id references auth.users(id), and auth.users is managed by Supabase Auth.
-- To create profiles, sign up a user via your app; the trigger will populate profiles.

-- Completion message
DO $$
BEGIN
  RAISE NOTICE 'Database setup inspection completed!';
  RAISE NOTICE 'If you see tables, RLS, policies, triggers, and functions above, your schema is correctly applied.';
END $$;

-- Show completion message
DO $$
BEGIN
  RAISE NOTICE 'Database setup test completed!';
  RAISE NOTICE 'If you see this message and the tables/policies above, your database is properly configured.';
END $$;
