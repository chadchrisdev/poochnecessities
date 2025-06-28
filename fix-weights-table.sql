-- Fix the weights table by adding the missing 'note' column
-- This will create the column if it doesn't exist

-- Check which schema the table is in
DO $$
DECLARE
    schema_name text;
    table_exists boolean;
BEGIN
    -- Check if weights table exists in public schema
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'weights'
    ) INTO table_exists;
    
    IF table_exists THEN
        schema_name := 'public';
    ELSE
        -- Check in other common schemas
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'weights'
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            RAISE EXCEPTION 'Weights table not found in any schema';
        END IF;
        
        -- Get schema name
        SELECT table_schema INTO schema_name
        FROM information_schema.tables 
        WHERE table_name = 'weights'
        LIMIT 1;
    END IF;
    
    -- Output the schema where table was found
    RAISE NOTICE 'Weights table found in schema: %', schema_name;
    
    -- Check if the note column exists in the table
    EXECUTE format('
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = %L 
            AND table_name = %L 
            AND column_name = %L
        )', schema_name, 'weights', 'note') INTO table_exists;
    
    -- Add the note column if it doesn't exist
    IF NOT table_exists THEN
        RAISE NOTICE 'Adding note column to %.weights', schema_name;
        EXECUTE format('ALTER TABLE %I.weights ADD COLUMN note text', schema_name);
    ELSE
        RAISE NOTICE 'Note column already exists in %.weights', schema_name;
    END IF;
END $$;

-- Enable Row Level Security on weights table if not already enabled
ALTER TABLE weights ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to select only weights of their own dogs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'weights' 
        AND policyname = 'Users can view their dogs'' weights'
    ) THEN
        CREATE POLICY "Users can view their dogs' weights" 
        ON weights
        FOR SELECT
        USING (
            dog_id IN (
                SELECT id FROM dogs 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Create RLS policy to allow users to insert weights only for their own dogs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'weights' 
        AND policyname = 'Users can insert weights for their dogs'
    ) THEN
        CREATE POLICY "Users can insert weights for their dogs" 
        ON weights
        FOR INSERT
        WITH CHECK (
            dog_id IN (
                SELECT id FROM dogs 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Create RLS policy to allow users to update weights only for their own dogs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'weights' 
        AND policyname = 'Users can update their dogs'' weights'
    ) THEN
        CREATE POLICY "Users can update their dogs' weights" 
        ON weights
        FOR UPDATE
        USING (
            dog_id IN (
                SELECT id FROM dogs 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Create RLS policy to allow users to delete weights only for their own dogs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'weights' 
        AND policyname = 'Users can delete their dogs'' weights'
    ) THEN
        CREATE POLICY "Users can delete their dogs' weights" 
        ON weights
        FOR DELETE
        USING (
            dog_id IN (
                SELECT id FROM dogs 
                WHERE user_id = auth.uid()
            )
        );
    END IF;
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