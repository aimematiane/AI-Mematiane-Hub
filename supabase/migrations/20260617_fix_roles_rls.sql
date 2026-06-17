-- Fix RLS on system tables - allow public SELECT
-- Roles, permissions, and role_permissions are system config tables that need to be readable

-- Disable RLS on roles (system table)
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on permissions (system table)
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on role_permissions (system table)
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read user_roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
