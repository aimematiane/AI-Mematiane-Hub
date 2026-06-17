-- Fix conflicting RLS policies on profiles table
-- Drop the restrictive user-only policy
DROP POLICY IF EXISTS "update_own_profile" ON profiles;

-- Create a permissive policy that allows:
-- 1. Users to update their own profile
-- 2. Admins to update any profile
CREATE POLICY "update_profile_permissive"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
