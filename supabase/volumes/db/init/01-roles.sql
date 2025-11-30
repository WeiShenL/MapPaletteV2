-- ============================================
-- Supabase Roles Setup
-- ============================================
-- Creates all required roles for Supabase services
-- Password will be set in 99-roles.sql using env var
-- ============================================

-- Create roles if they don't exist
DO $$
BEGIN
  -- Authenticator role (used by PostgREST)
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN;
  END IF;

  -- Anonymous role (for unauthenticated requests)
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;

  -- Authenticated role (for authenticated requests)
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;

  -- Service role (for admin/backend operations)
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;

  -- Supabase admin (meta operations)
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin NOLOGIN;
  END IF;

  -- Auth admin (for auth service)
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOLOGIN;
  END IF;

  -- Storage admin (for storage service)
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin NOLOGIN;
  END IF;

  -- Functions admin
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_functions_admin') THEN
    CREATE ROLE supabase_functions_admin NOLOGIN;
  END IF;

  -- Realtime admin
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
    CREATE ROLE supabase_realtime_admin NOLOGIN;
  END IF;

  -- PgBouncer (connection pooler)
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pgbouncer') THEN
    CREATE ROLE pgbouncer LOGIN;
  END IF;

  -- Dashboard user
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dashboard_user') THEN
    CREATE ROLE dashboard_user NOLOGIN;
  END IF;
END
$$;

-- Grant role memberships
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_auth_admin TO postgres;
GRANT supabase_storage_admin TO postgres;
GRANT supabase_functions_admin TO postgres;
GRANT supabase_realtime_admin TO postgres;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA storage TO postgres, service_role, supabase_storage_admin;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;

-- Enable access to auth schema for necessary roles
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin, postgres;

-- Note: Passwords are set in 99-roles.sql using environment variables
