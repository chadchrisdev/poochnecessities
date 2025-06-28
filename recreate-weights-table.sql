-- Script to completely recreate the weights table
-- This will preserve existing data if the table exists

DO $$
DECLARE
    table_exists boolean;
    temp_table_name text := 'weights_temp';
    has_data boolean;
BEGIN
    -- Check if weights table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'weights'
    ) INTO table_exists;
    
    -- Check if there's data to migrate
    IF table_exists THEN
        EXECUTE 'SELECT EXISTS(SELECT 1 FROM public.weights LIMIT 1)' INTO has_data;
        RAISE NOTICE 'Weights table exists and has data: %', has_data;
        
        -- If there's data, create a backup
        IF has_data THEN
            RAISE NOTICE 'Creating backup of existing weights data';
            
            -- Create a temporary table with all columns from weights
            EXECUTE 'CREATE TABLE ' || temp_table_name || ' AS SELECT * FROM public.weights';
            
            -- Log the columns in the temporary table
            RAISE NOTICE 'Columns in temporary table:';
            FOR r IN (
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = temp_table_name
                ORDER BY ordinal_position
            ) LOOP
                RAISE NOTICE '  Column: %, Type: %', r.column_name, r.data_type;
            END LOOP;
        END IF;
        
        -- Drop existing table
        RAISE NOTICE 'Dropping existing weights table';
        DROP TABLE public.weights;
    END IF;
    
    -- Create the weights table with the correct structure
    RAISE NOTICE 'Creating weights table with correct structure';
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
    
    -- Restore data if there was any
    IF table_exists AND has_data THEN
        RAISE NOTICE 'Restoring data to the new weights table';
        
        -- Dynamically build the INSERT statement based on columns that exist in both tables
        DECLARE
            insert_columns text := '';
            select_columns text := '';
        BEGIN
            FOR r IN (
                SELECT t1.column_name
                FROM information_schema.columns t1
                JOIN information_schema.columns t2 
                ON t1.column_name = t2.column_name
                WHERE t1.table_schema = 'public' AND t1.table_name = 'weights'
                AND t2.table_schema = 'public' AND t2.table_name = temp_table_name
            ) LOOP
                IF insert_columns <> '' THEN
                    insert_columns := insert_columns || ', ';
                    select_columns := select_columns || ', ';
                END IF;
                insert_columns := insert_columns || r.column_name;
                select_columns := select_columns || r.column_name;
            END LOOP;
            
            -- Only restore data if we have matching columns
            IF insert_columns <> '' THEN
                EXECUTE 'INSERT INTO public.weights (' || insert_columns || ') 
                         SELECT ' || select_columns || ' FROM ' || temp_table_name;
                RAISE NOTICE 'Data restored with columns: %', insert_columns;
            ELSE
                RAISE WARNING 'No matching columns found between old and new table';
            END IF;
        END;
        
        -- Drop the temporary table
        EXECUTE 'DROP TABLE ' || temp_table_name;
    END IF;
    
    -- Enable Row Level Security
    ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    -- Policy for SELECT
    CREATE POLICY "Users can view their dogs' weights" 
    ON public.weights
    FOR SELECT
    USING (
        dog_id IN (
            SELECT id FROM public.dogs 
            WHERE user_id = auth.uid()
        )
    );
    
    -- Policy for INSERT
    CREATE POLICY "Users can insert weights for their dogs" 
    ON public.weights
    FOR INSERT
    WITH CHECK (
        dog_id IN (
            SELECT id FROM public.dogs 
            WHERE user_id = auth.uid()
        )
    );
    
    -- Policy for UPDATE
    CREATE POLICY "Users can update their dogs' weights" 
    ON public.weights
    FOR UPDATE
    USING (
        dog_id IN (
            SELECT id FROM public.dogs 
            WHERE user_id = auth.uid()
        )
    );
    
    -- Policy for DELETE
    CREATE POLICY "Users can delete their dogs' weights" 
    ON public.weights
    FOR DELETE
    USING (
        dog_id IN (
            SELECT id FROM public.dogs 
            WHERE user_id = auth.uid()
        )
    );
    
    -- Verify dogs table has user_id column for RLS
    DECLARE
        has_user_id boolean;
    BEGIN
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'dogs' 
            AND column_name = 'user_id'
        ) INTO has_user_id;
        
        IF NOT has_user_id THEN
            RAISE WARNING 'Dogs table missing user_id column - RLS policies will not work properly';
            RAISE NOTICE 'Adding user_id column to dogs table';
            ALTER TABLE public.dogs ADD COLUMN user_id uuid REFERENCES auth.users(id);
        END IF;
    END;
    
    -- Notify success
    RAISE NOTICE 'Weights table successfully created with all required columns';
    RAISE NOTICE 'Run SELECT * FROM public.weights LIMIT 10 to verify';
END $$;

-- Verify the structure
SELECT 
    table_schema,
    table_name, 
    column_name, 
    data_type
FROM 
    information_schema.columns
WHERE 
    table_name = 'weights'
ORDER BY 
    ordinal_position;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- List the RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles,
    cmd, 
    qual
FROM 
    pg_policies
WHERE 
    tablename = 'weights'; 