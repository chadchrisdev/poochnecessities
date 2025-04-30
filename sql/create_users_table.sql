-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Set up Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow individual users to view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow individual users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;

-- Create security policies
CREATE POLICY "Allow individual users to view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow individual users to update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email)
  ON CONFLICT (id) DO NOTHING; -- Prevent errors on duplicate inserts
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create storage for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Drop existing storage policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow users to select their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to insert their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;

-- Set up storage security policies for avatars
CREATE POLICY "Allow users to select their own avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = SPLIT_PART(name, '/', 1));
  
CREATE POLICY "Allow users to insert their own avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = SPLIT_PART(name, '/', 1));

CREATE POLICY "Allow users to update their own avatars"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = SPLIT_PART(name, '/', 1));

CREATE POLICY "Allow users to delete their own avatars"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = SPLIT_PART(name, '/', 1)); 