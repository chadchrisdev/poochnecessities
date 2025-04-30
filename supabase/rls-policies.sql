-- Enable RLS on the avatars bucket and create policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        auth.uid() = (storage.foldername(name))[1]::uuid 
        AND bucket_id = 'avatars'
    );

-- Policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE 
    USING (
        auth.uid() = (storage.foldername(name))[1]::uuid 
        AND bucket_id = 'avatars'
    );

-- Policy to allow users to read all avatars
CREATE POLICY "Anyone can read avatars" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'avatars');

-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to update only their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id);

-- Policy to allow users to read all profiles
CREATE POLICY "Anyone can read profiles" ON public.users
    FOR SELECT 
    USING (true); 