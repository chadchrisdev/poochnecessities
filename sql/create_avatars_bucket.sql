-- Create avatars bucket (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own avatar" ON storage.objects;

-- Policy for uploading avatars (restricted to user's own ID)
CREATE POLICY "Allow authenticated users to upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  (name = auth.uid()::text || '.jpg' OR name = auth.uid()::text || '.png' OR name = auth.uid()::text || '.jpeg')
);

-- Policy for viewing avatars (restricted to user's own ID)
CREATE POLICY "Allow authenticated users to read their own avatar"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  (name = auth.uid()::text || '.jpg' OR name = auth.uid()::text || '.png' OR name = auth.uid()::text || '.jpeg')
);

-- Policy for updating avatars (restricted to user's own ID)
CREATE POLICY "Allow authenticated users to update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  (name = auth.uid()::text || '.jpg' OR name = auth.uid()::text || '.png' OR name = auth.uid()::text || '.jpeg')
);

-- Policy for deleting avatars (restricted to user's own ID)
CREATE POLICY "Allow authenticated users to delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  (name = auth.uid()::text || '.jpg' OR name = auth.uid()::text || '.png' OR name = auth.uid()::text || '.jpeg')
); 