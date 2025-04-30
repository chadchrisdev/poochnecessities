# Avatar Selection Feature

This feature allows users to either upload their own avatar or choose from predefined placeholder avatars.

## Features Added

1. **Choose Placeholder** button under the avatar section
2. Modal with horizontal scrolling list of placeholder avatars
3. Support for both uploaded and placeholder avatar types
4. Database schema updates to track avatar type and placeholder ID

## Implementation Details

### Database Schema Changes

The following columns were added to the `users` table:

- `avatar_type`: Indicates whether the avatar is "uploaded" or "placeholder"
- `avatar_placeholder_id`: Stores the ID of the placeholder avatar if using a predefined one

### Components Updates

#### ProfileSetupScreen.js
- Added placeholder avatar selection modal
- Updated avatar rendering logic to handle both remote URLs and local assets
- Added state to track avatar type
- Updated profile saving to store avatar type and placeholder ID

#### CreateAccountScreen.js
- Added the same placeholder avatar selection functionality
- Updated avatar upload logic to handle both types
- Modified profile creation to include avatar type information

## Assets Added

Three placeholder avatars were added to the assets:
- `assets/avatars/avatar1.png`
- `assets/avatars/avatar2.png`
- `assets/avatars/avatar3.png`

## How It Works

1. Users can either tap on the avatar to upload their own photo or click "Choose Placeholder"
2. If "Choose Placeholder" is selected, a modal opens with predefined avatar options
3. Selecting an avatar from the modal sets it as the current avatar and sets the type to "placeholder"
4. Uploading a custom avatar sets the type to "uploaded"
5. The app correctly renders both types of avatars throughout the application

## Technical Details

- For placeholder avatars, we use `Image.resolveAssetSource()` to get the URI of the local asset
- We store this information in the database, along with the avatar type and ID
- When rendering, we check the avatar type to determine how to display the image
- For uploaded avatars, we use the URL directly
- For placeholder avatars, we find the matching asset by ID and use the local asset

## Migration

Run the `sql/update_users_avatar_schema.sql` migration to add the necessary columns to the users table. 