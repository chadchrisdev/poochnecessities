-- Add first_name and last_name fields to users table
ALTER TABLE public.users 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update existing users to split full_name into first_name and last_name
UPDATE public.users
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
WHERE full_name IS NOT NULL AND POSITION(' ' IN full_name) > 0;

-- For users with only one name, set it as first_name
UPDATE public.users
SET first_name = full_name
WHERE full_name IS NOT NULL AND POSITION(' ' IN full_name) = 0; 