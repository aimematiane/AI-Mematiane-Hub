-- 1. Insert uploads bucket if it doesn't exist, and configure it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('uploads', 'uploads', true, 10485760, ARRAY['image/*', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/*', 'application/pdf'];

-- 2. Enable Row Level Security on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create Storage Policies for the 'uploads' bucket
-- Drop policies if they exist to allow re-running
DROP POLICY IF EXISTS "Allow public select from uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from uploads" ON storage.objects;

-- Select Policy: Allow anyone (public) to view/read files in the uploads bucket
CREATE POLICY "Allow public select from uploads" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

-- Insert Policy: Allow authenticated users to upload files to the uploads bucket
CREATE POLICY "Allow authenticated insert to uploads" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');

-- Update Policy: Allow authenticated users to update files in the uploads bucket
CREATE POLICY "Allow authenticated update to uploads" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');

-- Delete Policy: Allow authenticated users to delete files from the uploads bucket
CREATE POLICY "Allow authenticated delete from uploads" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'uploads');
