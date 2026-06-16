-- Create profile-images bucket (if not exists)
-- This migration sets up RLS policies for user profile images
-- Users can only access their own profile images
-- Note: RLS must be enabled on storage.objects in Supabase dashboard first

-- Allow authenticated users to upload to their own profile-images directory
create policy "Users can upload profile images to their own directory"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'uploads' 
    and (storage.foldername(name))[1] = 'profile-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow users to view only their own profile images
create policy "Users can view only their own profile images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = 'profile-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow users to delete only their own profile images
create policy "Users can delete only their own profile images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = 'profile-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow users to update only their own profile images (for upsert)
create policy "Users can update only their own profile images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = 'profile-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
