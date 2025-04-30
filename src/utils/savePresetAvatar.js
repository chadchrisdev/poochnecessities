import { supabase } from '../lib/supabase';

// Preset avatars - urls for the preset avatars
export const presetAvatars = [
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatar-dog-1.png',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatar-dog-2.png',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatar-dog-3.png',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatar-dog-4.png',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatar-dog-5.png',
];

/**
 * Saves a preset avatar URL to the user's profile
 * @param {string} userId - The user's ID
 * @param {string} avatarUrl - The URL of the preset avatar
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export const savePresetAvatar = async (userId, avatarUrl) => {
  try {
    if (!userId || !avatarUrl) {
      console.error('Missing userId or avatarUrl');
      return { success: false, error: new Error('Missing userId or avatarUrl') };
    }

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      console.error('Error saving preset avatar:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error saving preset avatar:', err);
    return { success: false, error: err };
  }
}; 