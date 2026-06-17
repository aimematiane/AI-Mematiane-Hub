-- Helper function to check admin status (security definer avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- Allow admins to update any profile (role, status, soft delete)
CREATE POLICY "admin_update_any_profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow admins to delete (soft-delete) any profile
CREATE POLICY "admin_delete_any_profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());
