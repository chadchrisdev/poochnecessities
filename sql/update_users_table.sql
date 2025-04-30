-- Update users table schema
-- Add full_name if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add profile_completed if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Add updated_at if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Optional: Clean up old columns if they exist and are no longer needed
ALTER TABLE public.users 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name;

-- Update RLS policies
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

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Create trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column(); 