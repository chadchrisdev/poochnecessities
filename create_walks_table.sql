-- Create walks table
CREATE TABLE IF NOT EXISTS public.walks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  distance_meters INTEGER NOT NULL,
  target_distance_meters INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.walks ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy (open for development)
CREATE POLICY "Allow full access for development" 
ON public.walks
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.walks IS 'Table to store dog walk records'; 