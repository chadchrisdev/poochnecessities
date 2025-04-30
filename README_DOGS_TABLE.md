# Dogs Table Setup

This document provides instructions for setting up the "dogs" table in your Supabase project for the Pooch Necessities app.

## SQL Commands

The `create_dogs_table.sql` file contains all the necessary SQL commands to:
1. Create the dogs table with the required structure
2. Enable Row Level Security (RLS)
3. Add a development policy for easy access
4. Insert a sample dog profile for "Lucy-Loo"

## How to Run the SQL

### Option 1: Using Supabase Dashboard

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor section
4. Create a new query
5. Copy the contents of `create_dogs_table.sql` into the editor
6. Click "Run" to execute the SQL commands

### Option 2: Using Supabase CLI

If you have the Supabase CLI set up with your project credentials:

```bash
# Run the SQL file directly
npx supabase db execute < create_dogs_table.sql
```

## Table Structure

The dogs table has the following structure:

| Column      | Type        | Description                               |
|-------------|-------------|-------------------------------------------|
| id          | UUID        | Primary key, auto-generated               |
| name        | TEXT        | Dog's name (required)                    |
| breed       | TEXT        | Dog's breed (optional)                   |
| birthday    | DATE        | Dog's date of birth (optional)           |
| photo_url   | TEXT        | URL to the dog's profile image (optional) |
| created_at  | TIMESTAMPTZ | Timestamp when record was created        |

## Sample Data

A sample dog profile for "Lucy-Loo" is included in the SQL:

- Name: Lucy-Loo
- Breed: French Bulldog
- Birthday: 2019-06-12
- Photo URL: URL to a sample image

## Testing the Table

After running the SQL, you can verify the table was created correctly by running a query in the Supabase dashboard:

```sql
SELECT * FROM public.dogs;
```

You should see one record for Lucy-Loo. 