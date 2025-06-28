-- Simple fix for weights table to add weight_kg column alongside weight column
-- Separate statements to avoid nested BEGIN/END blocks causing syntax errors

-- Check if table exists
DO $$
DECLARE
    table_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'weights'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'Table weights does not exist, creating it';
    ELSE
        RAISE NOTICE 'Table weights exists, will check columns';
    END IF;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.weights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
    weight numeric,
    weight_kg numeric,
    recorded_at timestamptz DEFAULT now(),
    note text,
    created_at timestamptz DEFAULT now()
);

-- Add weight column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weights' 
        AND column_name = 'weight'
    ) THEN
        ALTER TABLE public.weights ADD COLUMN weight numeric;
        RAISE NOTICE 'Added weight column';
    ELSE
        RAISE NOTICE 'weight column already exists';
    END IF;
END $$;

-- Add weight_kg column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weights' 
        AND column_name = 'weight_kg'
    ) THEN
        ALTER TABLE public.weights ADD COLUMN weight_kg numeric;
        RAISE NOTICE 'Added weight_kg column';
    ELSE
        RAISE NOTICE 'weight_kg column already exists';
    END IF;
END $$;

-- Add note column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weights' 
        AND column_name = 'note'
    ) THEN
        ALTER TABLE public.weights ADD COLUMN note text;
        RAISE NOTICE 'Added note column';
    ELSE
        RAISE NOTICE 'note column already exists';
    END IF;
END $$;

-- Add recorded_at column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weights' 
        AND column_name = 'recorded_at'
    ) THEN
        ALTER TABLE public.weights ADD COLUMN recorded_at timestamptz DEFAULT now();
        RAISE NOTICE 'Added recorded_at column';
    ELSE
        RAISE NOTICE 'recorded_at column already exists';
    END IF;
END $$;

-- Update any NULL weight_kg values from weight column
UPDATE public.weights 
SET weight_kg = weight 
WHERE weight_kg IS NULL AND weight IS NOT NULL;

-- Update any NULL weight values from weight_kg column
UPDATE public.weights 
SET weight = weight_kg 
WHERE weight IS NULL AND weight_kg IS NOT NULL;

-- Create a separate function for the trigger
CREATE OR REPLACE FUNCTION sync_weight_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.weight IS NULL AND NEW.weight_kg IS NOT NULL THEN
        NEW.weight = NEW.weight_kg;
    ELSIF NEW.weight_kg IS NULL AND NEW.weight IS NOT NULL THEN
        NEW.weight_kg = NEW.weight;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid errors
DROP TRIGGER IF EXISTS sync_weights ON public.weights;

-- Create trigger
CREATE TRIGGER sync_weights
BEFORE INSERT OR UPDATE ON public.weights
FOR EACH ROW
EXECUTE FUNCTION sync_weight_columns();

-- Enable Row Level Security
ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;

-- Create policies for security (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Users can view their dogs' weights" ON public.weights;
CREATE POLICY "Users can view their dogs' weights" 
ON public.weights
FOR SELECT
USING (
    dog_id IN (
        SELECT id FROM public.dogs 
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert weights for their dogs" ON public.weights;
CREATE POLICY "Users can insert weights for their dogs" 
ON public.weights
FOR INSERT
WITH CHECK (
    dog_id IN (
        SELECT id FROM public.dogs 
        WHERE user_id = auth.uid()
    )
);

-- Refresh cache
NOTIFY pgrst, 'reload schema';

-- Show the updated structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'weights'
ORDER BY ordinal_position; 