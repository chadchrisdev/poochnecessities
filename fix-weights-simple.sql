-- Simple script to add missing columns to weights table

-- Check if weights table exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'weights'
    ) THEN
        CREATE TABLE public.weights (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
            weight_kg numeric NOT NULL,
            recorded_at timestamptz NOT NULL DEFAULT now(),
            note text,
            created_at timestamptz DEFAULT now()
        );
        
        -- Create index for faster queries
        CREATE INDEX idx_weights_dog_id ON public.weights(dog_id);
        
        -- Enable RLS
        ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their dogs' weights" 
        ON public.weights
        FOR SELECT
        USING (
            dog_id IN (
                SELECT id FROM public.dogs 
                WHERE user_id = auth.uid()
            )
        );
        
        CREATE POLICY "Users can insert weights for their dogs" 
        ON public.weights
        FOR INSERT
        WITH CHECK (
            dog_id IN (
                SELECT id FROM public.dogs 
                WHERE user_id = auth.uid()
            )
        );
        
        RAISE NOTICE 'Created weights table with all required columns';
    ELSE
        RAISE NOTICE 'Weights table already exists, checking for missing columns';
        
        -- Add weight_kg column if missing
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
        
        -- Add note column if missing
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
        
        -- Add recorded_at column if missing
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
        
        -- Enable RLS if not already enabled
        IF NOT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = 'weights'
            AND rowsecurity = true
        ) THEN
            ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled Row Level Security on weights table';
        END IF;
    END IF;
END $$;

-- Show the current structure of the weights table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'weights'
ORDER BY 
    ordinal_position;

-- Refresh the schema cache to make sure Supabase picks up the changes
NOTIFY pgrst, 'reload schema'; 