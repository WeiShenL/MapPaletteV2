-- ============================================
-- Supabase Database Roles Initialization
-- ============================================
-- This file creates all required roles for Supabase services
-- Runs automatically when the database container first starts
-- ============================================

-- Create authenticator role (used by PostgREST)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT NOCREATEDB NOCREATEROLE NOSUPERUSER;
  END IF;
END
$$;

-- Create anon role (anonymous/public access)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- Create authenticated role (logged-in users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- Create service_role (backend services with elevated privileges)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- Create supabase_auth_admin (GoTrue/Auth service)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin LOGIN NOINHERIT CREATEROLE CREATEDB;
  END IF;
END
$$;

-- Create supabase_storage_admin (Storage API service)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin LOGIN NOINHERIT CREATEROLE CREATEDB;
  END IF;
END
$$;

-- Create dashboard_user (for Supabase Studio)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dashboard_user') THEN
    CREATE ROLE dashboard_user LOGIN NOINHERIT CREATEROLE CREATEDB;
  END IF;
END
$$;

-- Grant roles to authenticator (PostgREST switches to these roles based on JWT)
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- Set passwords for service accounts (using environment variables)
-- These will be set from POSTGRES_PASSWORD
ALTER ROLE supabase_auth_admin WITH PASSWORD :'POSTGRES_PASSWORD';
ALTER ROLE supabase_storage_admin WITH PASSWORD :'POSTGRES_PASSWORD';
ALTER ROLE authenticator WITH PASSWORD :'POSTGRES_PASSWORD';
ALTER ROLE dashboard_user WITH PASSWORD :'POSTGRES_PASSWORD';

-- Grant necessary permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Supabase roles created successfully';
  RAISE NOTICE 'Roles: authenticator, anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin, dashboard_user';
END
$$;
