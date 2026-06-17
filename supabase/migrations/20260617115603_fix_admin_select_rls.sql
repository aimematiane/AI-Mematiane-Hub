-- Fix posts SELECT: admins must see all posts (including drafts from other authors)
DROP POLICY IF EXISTS "select_published_posts" ON posts;
CREATE POLICY "select_posts"
  ON posts FOR SELECT
  USING (
    is_published = true
    OR author_id = auth.uid()
    OR public.is_admin()
  );

-- Fix news SELECT: same issue
DROP POLICY IF EXISTS "select_published_news" ON news;
CREATE POLICY "select_news"
  ON news FOR SELECT
  USING (
    is_published = true
    OR author_id = auth.uid()
    OR public.is_admin()
  );

-- Fix pages SELECT: admins must see all pages including unpublished
DROP POLICY IF EXISTS "select_published_pages" ON pages;
CREATE POLICY "select_pages"
  ON pages FOR SELECT
  USING (
    (is_published = true AND deleted_at IS NULL)
    OR author_id = auth.uid()
    OR public.is_admin()
  );

-- Fix media_files SELECT: admins should see all files
DROP POLICY IF EXISTS "select_own_media" ON media_files;
CREATE POLICY "select_media"
  ON media_files FOR SELECT
  USING (
    deleted_at IS NULL
    AND (uploaded_by = auth.uid() OR public.is_admin())
  );

-- Allow admins to insert/update/delete media on behalf of others
DROP POLICY IF EXISTS "insert_own_media" ON media_files;
CREATE POLICY "insert_media"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "update_own_media" ON media_files;
CREATE POLICY "update_media"
  ON media_files FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin())
  WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_media" ON media_files;
CREATE POLICY "delete_media"
  ON media_files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin());
