-- Update users table schema to support avatar placeholders
-- Add avatar_type column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_type TEXT;

-- Add avatar_placeholder_id column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_placeholder_id TEXT;

-- Update existing rows to set avatar_type = 'uploaded' where avatar_url exists
UPDATE public.users
SET avatar_type = 'uploaded'
WHERE avatar_url IS NOT NULL AND avatar_type IS NULL;

-- Create comment on columns
COMMENT ON COLUMN public.users.avatar_type IS 'Type of avatar: "uploaded" or "placeholder"';
COMMENT ON COLUMN public.users.avatar_placeholder_id IS 'ID of placeholder avatar if using a predefined avatar'; 