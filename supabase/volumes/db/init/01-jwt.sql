-- ============================================
-- Supabase JWT Configuration
-- ============================================
-- Configures JWT secret and settings at database level
-- ============================================

-- Create or replace the auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant permissions on auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- Create configuration table for auth settings
CREATE TABLE IF NOT EXISTS auth.config (
  parameter TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Store JWT configuration
-- Note: These will be populated by environment variables through PostgreSQL
DO $$
BEGIN
  -- JWT Secret (will be set from environment)
  INSERT INTO auth.config (parameter, value)
  VALUES ('jwt_secret', current_setting('app.jwt_secret', true))
  ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;

  -- JWT Expiry (will be set from environment)
  INSERT INTO auth.config (parameter, value)
  VALUES ('jwt_exp', current_setting('app.jwt_exp', true))
  ON CONFLICT (parameter) DO UPDATE SET value = EXCLUDED.value;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'JWT config will be set by GoTrue service';
END
$$;

-- Create helper function to verify JWT tokens
-- This is used by PostgREST and other services
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      current_setting('request.jwt.claim', true),
      current_setting('request.jwt.claims', true)
    )::jsonb
$$;

-- Create helper function to get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )::uuid
$$;

-- Create helper function to get user role from JWT
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      current_setting('request.jwt.claim.role', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
    )::text
$$;

-- Create helper function to get user email from JWT
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(
      current_setting('request.jwt.claim.email', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
    )::text
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.email() TO anon, authenticated, service_role;

-- Create auth.users table that will be managed by GoTrue
-- This is a minimal schema; GoTrue will add more columns
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aud varchar(255),
  role varchar(255),
  email varchar(255) UNIQUE,
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token varchar(255),
  confirmation_sent_at timestamptz,
  recovery_token varchar(255),
  recovery_sent_at timestamptz,
  email_change_token_new varchar(255),
  email_change varchar(255),
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz,
  updated_at timestamptz,
  phone text UNIQUE,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token varchar(255),
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current varchar(255),
  email_change_confirm_status smallint,
  banned_until timestamptz,
  reauthentication_token varchar(255),
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamptz
);

-- Grant permissions on auth.users
GRANT SELECT ON auth.users TO postgres, authenticator;
GRANT ALL ON auth.users TO supabase_auth_admin;

-- Create indexes on auth.users
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users (instance_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);
CREATE INDEX IF NOT EXISTS users_is_sso_user_idx ON auth.users (is_sso_user);

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'JWT configuration completed';
  RAISE NOTICE 'Auth schema and helper functions created';
END
$$;
