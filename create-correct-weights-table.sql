-- Fix the weights table column mismatch
-- The code expects 'weight_kg' but the database has 'weight'

DO $$
DECLARE
    table_exists boolean;
    has_weight boolean;
    has_weight_kg boolean;
BEGIN
    -- Check if weights table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'weights'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Create the table with the correct column name matching the code
        CREATE TABLE public.weights (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,
            weight_kg numeric NOT NULL,  -- Use weight_kg as in the code
            recorded_at timestamptz NOT NULL DEFAULT now(),
            note text,
            created_at timestamptz DEFAULT now()
        );
        
        RAISE NOTICE 'Created new weights table with weight_kg column';
    ELSE
        -- Check which columns exist
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'weights' 
            AND column_name = 'weight'
        ) INTO has_weight;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'weights' 
            AND column_name = 'weight_kg'
        ) INTO has_weight_kg;
        
        -- Handle the column mismatch
        IF has_weight AND NOT has_weight_kg THEN
            -- If only 'weight' exists, add 'weight_kg' as an alias
            RAISE NOTICE 'Adding weight_kg column that mirrors the weight column';
            
            -- Create a trigger to synchronize the columns
            EXECUTE 'ALTER TABLE public.weights ADD COLUMN weight_kg numeric';
            
            -- Copy existing values
            EXECUTE 'UPDATE public.weights SET weight_kg = weight';
            
            -- Make weight_kg NOT NULL
            EXECUTE 'ALTER TABLE public.weights ALTER COLUMN weight_kg SET NOT NULL';
            
            -- Create trigger to keep them in sync
            EXECUTE '
                CREATE OR REPLACE FUNCTION sync_weight_columns()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF TG_OP = ''INSERT'' OR TG_OP = ''UPDATE'' THEN
                        IF NEW.weight IS NULL AND NEW.weight_kg IS NOT NULL THEN
                            NEW.weight := NEW.weight_kg;
                        ELSIF NEW.weight_kg IS NULL AND NEW.weight IS NOT NULL THEN
                            NEW.weight_kg := NEW.weight;
                        END IF;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            ';
            
            EXECUTE '
                CREATE TRIGGER sync_weights
                BEFORE INSERT OR UPDATE ON public.weights
                FOR EACH ROW
                EXECUTE FUNCTION sync_weight_columns();
            ';
            
            RAISE NOTICE 'Added trigger to keep weight and weight_kg in sync';
        ELSIF NOT has_weight AND has_weight_kg THEN
            -- If only weight_kg exists, we're good!
            RAISE NOTICE 'Table already has weight_kg column, which matches the code';
        ELSIF NOT has_weight AND NOT has_weight_kg THEN
            -- Neither column exists (unusual)
            RAISE NOTICE 'Table is missing both weight columns, adding weight_kg';
            EXECUTE 'ALTER TABLE public.weights ADD COLUMN weight_kg numeric NOT NULL';
        ELSE
            -- Both columns exist
            RAISE NOTICE 'Both weight and weight_kg columns exist, ensuring data consistency';
            -- Make sure they're in sync
            EXECUTE 'UPDATE public.weights SET weight_kg = weight WHERE weight_kg IS NULL';
            EXECUTE 'UPDATE public.weights SET weight = weight_kg WHERE weight IS NULL';
        END IF;
    END IF;
    
    -- Make sure note column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weights' 
        AND column_name = 'note'
    ) THEN
        ALTER TABLE public.weights ADD COLUMN note text;
        RAISE NOTICE 'Added note column';
    END IF;
    
    -- Make sure recorded_at column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weights' 
        AND column_name = 'recorded_at'
    ) THEN
        ALTER TABLE public.weights ADD COLUMN recorded_at timestamptz DEFAULT now();
        RAISE NOTICE 'Added recorded_at column';
    END IF;
    
    -- Enable RLS
    ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies if they don't exist
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'weights' 
        AND policyname = 'Users can view their dogs'' weights'
    ) THEN
        CREATE POLICY "Users can view their dogs' weights" 
        ON public.weights
        FOR SELECT
        USING (
            dog_id IN (
                SELECT id FROM public.dogs 
                WHERE user_id = auth.uid()
            )
        );
        RAISE NOTICE 'Created SELECT policy';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'weights' 
        AND policyname = 'Users can insert weights for their dogs'
    ) THEN
        CREATE POLICY "Users can insert weights for their dogs" 
        ON public.weights
        FOR INSERT
        WITH CHECK (
            dog_id IN (
                SELECT id FROM public.dogs 
                WHERE user_id = auth.uid()
            )
        );
        RAISE NOTICE 'Created INSERT policy';
    END IF;
END $$;

-- Show the updated column structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'weights'
ORDER BY ordinal_position;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 