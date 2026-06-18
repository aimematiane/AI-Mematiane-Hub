-- Run on existing Supabase projects to tighten storage and audit-log policies.
-- Safe to re-run: drops old policies before recreating.

-- Audit logs: admin-only inserts
DROP POLICY IF EXISTS "insert_audit_logs" ON public.audit_logs;
CREATE POLICY "insert_audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- General uploads bucket: staff-only write (profile-images keep their own policies)
DROP POLICY IF EXISTS "Allow authenticated insert to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin insert to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete from uploads" ON storage.objects;

CREATE POLICY "Allow staff insert to uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user')
  );

CREATE POLICY "Allow staff update to uploads" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user')
  )
  WITH CHECK (
    bucket_id = 'uploads'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user')
  );

CREATE POLICY "Allow staff delete from uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role <> 'user')
  );
