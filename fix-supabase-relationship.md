# How to Fix the Supabase Relationship Error

This guide addresses the error: **"Could not find a relationship between 'activities' and 'dog_id' in the schema cache."**

## Step 1: Run the Database Migration

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `supabase-migration.sql`
4. Run the SQL query

This will:
- Add a `dog_id` column to the `activities` table (if not already present)
- Create a foreign key relationship between `activities.dog_id` and `dogs.id`
- Apply the `ON DELETE SET NULL` constraint

## Step 2: Data Migration (Optional)

If you have existing activity data, choose one of the migration options in the SQL file:
- Option 1: Assign a specific dog to all activities
- Option 2: Assign the first dog to all activities
- Option 3: Leave activities without any dog (default)

Uncomment the appropriate SQL block in the file and run it.

## Step 3: Verify the Changes

After applying the migration, check that:
1. The `dog_id` column exists in the `activities` table
2. The foreign key relationship is visible in the Supabase Table Editor
3. You can use the following query format in your app:

```js
const { data, error } = await supabase
  .from('activities')
  .select('*, dogs(id, name)');
```

## Troubleshooting

If you encounter any errors:

1. **Schema issues**: Make sure you're using the right schema names. The tables are likely in the `public` schema.
2. **Table names**: Confirm the exact table names in your Supabase dashboard.
3. **Column types**: Ensure that `dog_id` in `activities` and `id` in `dogs` are both of type `UUID`.
4. **Existing constraints**: If you get an error about the constraint already existing, you can ignore it.

## Additional Information

The relationship between `activities` and `dogs` is a one-to-many relationship:
- One dog can have many activities
- Each activity belongs to at most one dog (or none if `dog_id` is NULL)

This is a common pattern in database design and allows you to track which dog was involved in each activity. 