-- Keep deleted pages private even if they were previously published.
-- Split anonymous and authenticated access so public reads never need admin checks.

DROP POLICY IF EXISTS "select_published_pages" ON public.pages;
DROP POLICY IF EXISTS "select_own_or_admin_pages" ON public.pages;

CREATE POLICY "select_published_pages" ON public.pages
  FOR SELECT TO anon
  USING (
    deleted_at IS NULL
    AND is_published = true
  );

CREATE POLICY "select_own_or_admin_pages" ON public.pages
  FOR SELECT TO authenticated
  USING (
    (deleted_at IS NULL AND is_published = true)
    OR author_id = auth.uid()
    OR public.is_admin()
  );
