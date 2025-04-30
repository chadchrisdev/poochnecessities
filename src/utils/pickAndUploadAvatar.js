import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { decode } from 'base64-arraybuffer';

// Helper for base64 to Blob conversion that works in Expo environment
const base64ToBlob = async (base64, type) => {
  try {
    console.log('Converting base64 to blob format...');
    // Using data URI approach which is more reliable in React Native
    const response = await fetch(`data:${type};base64,${base64}`);
    const blob = await response.blob();
    console.log('Blob created successfully, size:', blob.size);
    return blob;
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw error;
  }
};

// Generic function for picking and uploading images
export const pickAndUploadImage = async (options) => {
  const {
    entityId, // User ID, dog ID, etc.
    bucketName = 'avatars', // Default to avatars bucket
    pathPrefix = '', // Optional subfolder path 
    aspectRatio = [1, 1], // Default to square
    existingImage = null, // Optional pre-picked image
    updateTable = null, // Optional table to update with image URL
    updateColumn = null, // Column name to update
    whereColumn = 'id', // Default to 'id' column for WHERE clause
  } = options;

  try {
    let selectedAsset;
    
    // If an image was already picked and passed in, use it
    if (existingImage) {
      console.log('Using existing selected image');
      selectedAsset = existingImage;
    } else {
      // Otherwise, request permission and pick a new image
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return { imageUrl: null, error: new Error('Permission not granted') };
      }
      
      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.5, // Reduce quality for smaller file size
      });

      if (result.canceled) {
        console.log('Image picking cancelled');
        return { imageUrl: null, error: null };
      }
      
      selectedAsset = result.assets[0];
    }

    const uri = selectedAsset.uri;
    // Create storage path with optional prefix
    const filePath = pathPrefix 
      ? `${pathPrefix}/${entityId}_${Date.now()}.jpeg`
      : `${entityId}/${Date.now()}.jpeg`;
    const fileType = 'image/jpeg';

    console.log('Picked image:', uri);
    console.log('File will be saved as:', filePath);

    // Get the image content with FileSystem
    const fileContent = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('Got file content, length:', fileContent.length);

    // Convert to array buffer (this is the most reliable method for Supabase storage)
    const fileData = decode(fileContent);
    
    console.log('Converted to array buffer, uploading to Supabase...');

    // Upload directly to Supabase with array buffer approach
    const { data, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, fileData, {
        contentType: fileType,
        upsert: true
      });
    
    if (uploadError) {
      console.error(`Error uploading to Supabase bucket ${bucketName}:`, uploadError);
      return { imageUrl: null, error: uploadError };
    }
    
    console.log('Upload successful:', data);
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('Public URL:', publicUrl);

    // Optionally update a database table with the image URL
    if (updateTable && updateColumn) {
      const { error: updateError } = await supabase
        .from(updateTable)
        .update({ 
          [updateColumn]: publicUrl
        })
        .eq(whereColumn, entityId);

      if (updateError) {
        console.error(`Error updating ${updateTable} table:`, updateError);
        return { imageUrl: publicUrl, error: updateError };
      }
      
      console.log(`${updateTable} updated successfully with new image URL`);
    }

    return { imageUrl: publicUrl, error: null };
    
  } catch (err) {
    console.error('Unexpected error picking/uploading image:', err);
    Alert.alert(
      'Upload Failed',
      'There was a problem uploading your image. Please try again with a smaller image or check your internet connection.'
    );
    return { imageUrl: null, error: err };
  }
};

export const pickAndUploadAvatar = async (userId, existingImage = null) => {
  const result = await pickAndUploadImage({
    entityId: userId,
    bucketName: 'avatars',
    existingImage,
    updateTable: 'users',
    updateColumn: 'avatar_url'
  });
  
  return { 
    avatarUrl: result.imageUrl, 
    error: result.error 
  };
};

export const pickAndUploadDogImage = async (userId, existingImage = null) => {
  const result = await pickAndUploadImage({
    entityId: userId,
    bucketName: 'avatars',
    pathPrefix: `dogs/${userId}`,
    aspectRatio: [1, 1],
    existingImage,
  });
  
  return { 
    dogImageUrl: result.imageUrl, 
    error: result.error 
  };
}; 