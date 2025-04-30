import { supabase } from '../src/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sign up with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} fullName - User's full name
 * @returns {Promise<Object>} Result containing user data or error
 */
export const signUp = async (email, password, fullName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing up:', error.message);
    return { data: null, error };
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} Result containing user data or error
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error.message);
    return { data: null, error };
  }
};

/**
 * Sign out current user
 * @returns {Promise<Object>} Result containing success status or error
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error.message);
    return { error };
  }
};

/**
 * Get the current logged in user
 * @returns {Promise<Object>} Current user or null
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error getting current user:', error.message);
    return { user: null, error };
  }
};

/**
 * Get the current user's profile from the users table
 * @returns {Promise<Object>} User profile or null
 */
export const getUserProfile = async () => {
  try {
    const { user, error: getUserError } = await getCurrentUser();
    if (getUserError || !user) throw getUserError || new Error('No user found');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return { profile: data, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error.message);
    return { profile: null, error };
  }
};

/**
 * Create or update a user profile
 * @param {Object} profileData - Profile data to update (full_name, avatar_url)
 * @returns {Promise<Object>} Updated profile or error
 */
export const updateUserProfile = async (profileData) => {
  try {
    const { user, error: getUserError } = await getCurrentUser();
    if (getUserError || !user) throw getUserError || new Error('No user found');

    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { profile: data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    return { profile: null, error };
  }
};

/**
 * Upload a profile avatar
 * @param {string} uri - Local URI of the image
 * @returns {Promise<Object>} URL of the uploaded image or error
 */
export const uploadAvatar = async (uri) => {
  try {
    const { user, error: getUserError } = await getCurrentUser();
    if (getUserError || !user) throw getUserError || new Error('No user found');

    // Create a unique file name
    const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
    
    // Convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    if (!urlData || !urlData.publicUrl) throw new Error('Failed to get public URL');
    
    // Update user profile with avatar URL
    const { profile, error: updateError } = await updateUserProfile({
      avatar_url: urlData.publicUrl
    });
    
    if (updateError) throw updateError;
    
    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading avatar:', error.message);
    return { url: null, error };
  }
};

/**
 * Fetch user profile from database
 * @param {string} userId - The user ID to fetch profile for
 * @returns {Promise<{profile: Object|null, error: Error|null}>}
 */
export const fetchUserProfile = async (userId) => {
  try {
    if (!userId) {
      return { profile: null, error: new Error('User ID is required') };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { profile: data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    return { profile: null, error };
  }
};

/**
 * Sign in user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    return { session: data.session, error: null };
  } catch (error) {
    console.error('Error signing in:', error.message);
    return { session: null, error };
  }
};

/**
 * Sign up user with email, password, and full name
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User's full name
 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export const signUpWithEmail = async (email, password, fullName) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    
    if (authData?.user) {
      // Check if a profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();
        
      // Only insert if profile doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: email,
              full_name: fullName,
              created_at: new Date(),
            },
          ]);

        if (profileError) throw profileError;
      }
    }

    return { session: authData.session, error: null };
  } catch (error) {
    console.error('Error signing up:', error.message);
    return { session: null, error };
  }
};

/**
 * Get the current session
 * @returns {Promise<{session: Object|null, error: Error|null}>}
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error) {
    console.error('Error getting session:', error.message);
    return { session: null, error };
  }
}; 