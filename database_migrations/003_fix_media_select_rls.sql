-- Fix select_media_files RLS policy to allow soft deletes to be updated by owners or admins.
-- When soft-deleting a row via UPDATE (setting deleted_at = now()), the updated row must still satisfy the SELECT policy.
-- Therefore, SELECT policy must allow owners or admins to select soft-deleted rows.

DROP POLICY IF EXISTS "select_media_files" ON public.media_files;

CREATE POLICY "select_media_files" ON public.media_files 
  FOR SELECT TO anon, authenticated 
  USING (deleted_at IS NULL OR auth.uid() = uploaded_by OR public.is_admin());
