# Profile Setup Migration Guide

This guide explains the changes made to update the profile setup flow to use a single `full_name` field instead of separate `first_name` and `last_name` fields.

## Database Changes

The following SQL changes have been applied to the Supabase database:

```sql
-- Update users table schema
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add profile_completed if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Add updated_at if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Optional: Clean up old columns if they exist and are no longer needed
ALTER TABLE public.users 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name;
```

## Code Changes

### 1. ProfileSetupScreen.js
- Updated to use a single `full_name` field instead of separate name fields
- Only `full_name` and `avatar_url` are required fields
- All other fields are optional

### 2. CreateAccountScreen.js
- Updated to collect and store a single `full_name` instead of `first_name` and `last_name`
- Updated UI to show a single name field
- Updated validation to check for a valid full name

### 3. Avatar Upload Utility
- Fixed issues with the avatar upload functionality
- Simplified the upload flow to use array buffer approach
- Made error handling more robust

## Verification Steps

1. **Database Schema**
   - Verify the `users` table has a `full_name` column
   - Verify the `first_name` and `last_name` columns have been removed

2. **User Registration**
   - Create a new account
   - Verify user can enter their full name in a single field
   - Verify profile setup step works correctly after registration

3. **Profile Updating**
   - Test updating an existing profile
   - Verify all fields save correctly
   - Verify avatar upload works properly

4. **Avatar Upload**
   - Test uploading an avatar during registration
   - Test updating avatar from profile page
   - Verify the image appears correctly in the app

## Compatibility Notes

This change ensures compatibility with future social login options like Google and Facebook, which typically provide a single `name` field rather than separate first and last name fields.

If you have any components or screens that were referencing `first_name` or `last_name` directly, you'll need to update them to use `full_name` instead. 