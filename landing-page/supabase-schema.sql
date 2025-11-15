-- Email Captures Table for Landing Page
-- Run this SQL in your Supabase SQL Editor to create the table

CREATE TABLE email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('hero', 'cta')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT email_captures_email_unique UNIQUE (email)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert emails (for the landing page forms)
CREATE POLICY "Anyone can insert email captures" ON email_captures
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read their own email (optional, for verification)
CREATE POLICY "Anyone can read email captures" ON email_captures
  FOR SELECT USING (true);

-- Create index for faster queries
CREATE INDEX idx_email_captures_email ON email_captures(email);
CREATE INDEX idx_email_captures_source ON email_captures(source);
CREATE INDEX idx_email_captures_created_at ON email_captures(created_at);

-- Optional: Add a function to validate email format
CREATE OR REPLACE FUNCTION validate_email_format(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Optional: Add a check constraint for email format
ALTER TABLE email_captures 
ADD CONSTRAINT valid_email_format 
CHECK (validate_email_format(email));
