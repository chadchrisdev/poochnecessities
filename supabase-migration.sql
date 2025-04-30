-- Supabase Migration SQL
-- Run this in the Supabase SQL Editor to fix the relationship between activities and dogs tables
--
-- This fixes the error: "Could not find a relationship between 'activities' and 'dog_id'"
-- The issue was that we needed to:
-- 1. Create a proper foreign key relationship between activities.dog_id and dogs.id
-- 2. Use the correct schema qualification ("public".) in all references
-- 3. Ensure we use the right Supabase query format: .select('*, dogs(id, name)')

-- Step 1: Add dog_id column to activities table if it doesn't exist
ALTER TABLE "public"."activities" 
ADD COLUMN IF NOT EXISTS dog_id UUID REFERENCES "public"."dogs"(id) ON DELETE SET NULL;

-- Step 2: If the column exists but doesn't have the foreign key constraint, add it
-- This may error if the constraint already exists, which is fine
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_activities_dog'
  ) THEN
    ALTER TABLE "public"."activities"
    ADD CONSTRAINT fk_activities_dog 
    FOREIGN KEY (dog_id) 
    REFERENCES "public"."dogs"(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Step 3: Data migration options - CHOOSE ONE if needed:

-- Option 1: If you have a default dog you want to assign to all existing activities:
-- UPDATE "public"."activities" SET dog_id = 'your-default-dog-uuid-here' WHERE dog_id IS NULL;

-- Option 2: Assign the first dog to all existing activities (if you have at least one dog):
-- WITH first_dog AS (SELECT id FROM "public"."dogs" LIMIT 1)
-- UPDATE "public"."activities" SET dog_id = (SELECT id FROM first_dog) WHERE dog_id IS NULL;

-- Option 3: Leave activities without a dog assignment
-- No action needed as the foreign key is nullable (ON DELETE SET NULL)

-- Example query: Join activities with dogs
-- SELECT a.*, d.name as dog_name 
-- FROM "public"."activities" a
-- LEFT JOIN "public"."dogs" d ON a.dog_id = d.id;

-- Example Supabase query:
-- .from('activities').select('*, dogs(id, name)'); 