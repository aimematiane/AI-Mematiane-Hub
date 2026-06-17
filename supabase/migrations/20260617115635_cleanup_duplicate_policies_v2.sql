-- Remove old media_files policies (replaced by admin-aware versions)
DROP POLICY IF EXISTS "delete_media_files" ON media_files;
DROP POLICY IF EXISTS "insert_media_files" ON media_files;
DROP POLICY IF EXISTS "select_media_files" ON media_files;
DROP POLICY IF EXISTS "update_media_files" ON media_files;

-- Remove old pages policies
DROP POLICY IF EXISTS "manage_pages" ON pages;
DROP POLICY IF EXISTS "author_insert_pages" ON pages;
DROP POLICY IF EXISTS "author_update_own_pages" ON pages;

-- Admins can do anything with pages
CREATE POLICY "admin_manage_pages"
  ON pages FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Authors can insert their own pages
CREATE POLICY "author_insert_pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Authors can update their own pages
CREATE POLICY "author_update_own_pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (author_id = auth.uid());
