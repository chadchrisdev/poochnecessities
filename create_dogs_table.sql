-- Create dogs table
CREATE TABLE IF NOT EXISTS public.dogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  breed TEXT,
  birthday DATE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy (open for development)
CREATE POLICY "Allow full access for development" 
ON public.dogs
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.dogs IS 'Table to store dog profiles';

-- Insert sample dog
INSERT INTO public.dogs (name, breed, birthday, photo_url)
VALUES (
  'Lucy-Loo',
  'French Bulldog',
  '2019-06-12',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/4448cecd1a-a0473bdbb6739fbad579.png'
); 