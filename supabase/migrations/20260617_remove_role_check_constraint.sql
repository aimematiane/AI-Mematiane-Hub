-- Remove the restrictive CHECK constraint - allow application validation instead
-- This allows any role name from the roles table to be used
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS "profiles_role_check";
