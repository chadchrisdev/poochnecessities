import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { presetAvatars, savePresetAvatar } from '../utils/savePresetAvatar';
import { pickAndUploadAvatar } from '../utils/pickAndUploadAvatar';
import UserAvatar from './UserAvatar';
import { createInitialAvatar, svgToDataUri } from '../utils/createInitialAvatar';
import { supabase } from '../lib/supabase';

const AvatarSelector = ({ 
  userId, 
  currentAvatarUrl = null,
  currentAvatarType = null,
  userName = '',
  onAvatarChange = () => {}, 
  title = 'Profile Photo',
  titleStyle = {},
  containerStyle = {} 
}) => {
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(currentAvatarUrl);
  const [selectedAvatarType, setSelectedAvatarType] = useState(currentAvatarType);
  const [uploading, setUploading] = useState(false);

  // Function to handle preset avatar selection
  const handleSelectPresetAvatar = async (avatarUrl) => {
    try {
      setUploading(true);
      
      if (!userId) {
        Alert.alert('Error', 'No user ID provided');
        return;
      }
      
      const { success, error } = await savePresetAvatar(userId, avatarUrl);
      
      if (error) {
        Alert.alert('Error', 'Failed to save avatar. Please try again.');
        return;
      }
      
      setSelectedAvatarUrl(avatarUrl);
      setSelectedAvatarType('uploaded');
      onAvatarChange(avatarUrl, 'uploaded');
      
    } catch (error) {
      console.error('Error selecting preset avatar:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Function to handle custom avatar upload
  const handleUploadAvatar = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'No user ID provided');
        return;
      }
      
      setUploading(true);
      
      const { avatarUrl, error } = await pickAndUploadAvatar(userId);
      
      if (error) {
        Alert.alert('Error', 'Failed to upload avatar. Please try again.');
        return;
      }
      
      if (avatarUrl) {
        setSelectedAvatarUrl(avatarUrl);
        setSelectedAvatarType('uploaded');
        onAvatarChange(avatarUrl, 'uploaded');
      }
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Function to use initial avatar
  const handleUseInitialAvatar = async () => {
    try {
      if (!userId || !userName) {
        Alert.alert('Error', 'Missing user information');
        return;
      }
      
      setUploading(true);
      
      // Update user profile with avatar_type = 'initial'
      const { error } = await supabase
        .from('users')
        .update({ 
          avatar_type: 'initial',
          avatar_url: null
        })
        .eq('id', userId);
        
      if (error) {
        Alert.alert('Error', 'Failed to update avatar. Please try again.');
        return;
      }
      
      // Set state to show initial avatar
      setSelectedAvatarUrl(null);
      setSelectedAvatarType('initial');
      onAvatarChange(null, 'initial');
      
    } catch (error) {
      console.error('Error setting initial avatar:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Render preset avatar item
  const renderPresetAvatar = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.presetAvatar, 
        selectedAvatarUrl === item && styles.selectedPresetAvatar
      ]}
      onPress={() => handleSelectPresetAvatar(item)}
      disabled={uploading}
    >
      <Image source={{ uri: item }} style={styles.presetAvatarImage} />
      {selectedAvatarUrl === item && (
        <View style={styles.checkmarkBadge}>
          <FontAwesome5 name="check" size={12} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      
      {/* Current Avatar */}
      <View style={styles.currentAvatarContainer}>
        <UserAvatar
          avatarUrl={selectedAvatarUrl}
          userName={userName}
          avatarType={selectedAvatarType}
          size={120}
          loading={uploading}
          showEditButton={true}
          onPress={handleUploadAvatar}
        />
        <Text style={styles.uploadText}>
          {uploading ? 'Uploading...' : 'Tap to upload photo'}
        </Text>
      </View>
      
      {/* Initial Avatar Option */}
      <TouchableOpacity 
        style={styles.initialAvatarButton} 
        onPress={handleUseInitialAvatar}
        disabled={uploading}
      >
        <Text style={styles.initialAvatarButtonText}>
          Use Initial Avatar ({userName ? userName.charAt(0).toUpperCase() : '?'})
        </Text>
      </TouchableOpacity>
      
      {/* Preset Avatars */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsTitle}>Or choose from presets:</Text>
        <FlatList
          data={presetAvatars}
          renderItem={renderPresetAvatar}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsList}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  currentAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  initialAvatarButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  initialAvatarButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  presetsContainer: {
    width: '100%',
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  presetsList: {
    paddingVertical: 10,
  },
  presetAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPresetAvatar: {
    borderColor: '#8B5CF6',
  },
  presetAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default AvatarSelector; 