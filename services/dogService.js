import { supabase } from '../src/lib/supabase';

/**
 * Get all dogs
 * @returns {Promise<Array>} Array of dog objects
 */
export const fetchDogs = async () => {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching dogs:', error);
    throw error;
  }
};

/**
 * Get a single dog by ID
 * @param {string} id - The dog's UUID
 * @returns {Promise<Object>} Dog object
 */
export const fetchDogById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching dog with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new dog profile
 * @param {Object} dogData - The dog data
 * @returns {Promise<Object>} Created dog object
 */
export const createDog = async (dogData) => {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .insert([dogData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating dog profile:', error);
    throw error;
  }
};

/**
 * Update an existing dog profile
 * @param {string} id - The dog's UUID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} Updated dog object
 */
export const updateDog = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('dogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error updating dog with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a dog profile
 * @param {string} id - The dog's UUID
 * @returns {Promise<void>}
 */
export const deleteDog = async (id) => {
  try {
    const { error } = await supabase
      .from('dogs')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`Error deleting dog with ID ${id}:`, error);
    throw error;
  }
}; 