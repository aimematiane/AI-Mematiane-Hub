-- Fix role constraint to allow new role names from CMS
-- Drop the restrictive CHECK constraint on profiles.role
-- We'll rely on application validation against the roles table instead
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS "profiles_role_check";

-- Ensure default role is set correctly
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';
