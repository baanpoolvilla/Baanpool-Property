-- ============================================================================
-- PostgREST Role & Permissions Setup
-- Run this AFTER setup.sql
-- ============================================================================

-- 1. Create the anonymous role (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_anon') THEN
    CREATE ROLE web_anon NOLOGIN;
  END IF;
END
$$;

-- 2. Grant permissions on tables
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON property_fields TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON properties       TO web_anon;

-- 3. Grant sequence access (for INSERT with auto-increment id)
GRANT USAGE, SELECT ON SEQUENCE property_fields_id_seq TO web_anon;
GRANT USAGE, SELECT ON SEQUENCE properties_id_seq      TO web_anon;

-- 4. Make sure the current user (postgres) can switch to web_anon
GRANT web_anon TO postgres;
