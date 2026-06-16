-- Fix overly permissive storage policies for the uploads bucket
-- Replace bucket-level UPDATE/DELETE with ownership-based policies

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow authenticated update to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete to uploads" ON storage.objects;

-- Update: Only allow users to update files in their own directory
CREATE POLICY "Allow owner update to uploads" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Delete: Only allow users to delete files in their own directory
CREATE POLICY "Allow owner delete to uploads" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
