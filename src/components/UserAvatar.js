import React from 'react';
import { 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  View, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import InitialAvatar from './InitialAvatar';

const UserAvatar = ({ 
  avatarUrl, 
  size = 80, 
  onPress, 
  loading = false, 
  showEditButton = false,
  style = {},
  localImage = null, // Added support for local preset images
  userName = '', // Added for initial avatar support
  avatarType = null // 'uploaded' or 'initial'
}) => {
  // Default profile image (fallback if no avatar_url)
  const defaultAvatar = 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4448cecd1a-a0473bdbb6739fbad579.png';
  
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    position: 'relative',
    ...style
  };
  
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 3,
    borderColor: '#8B5CF6',
  };
  
  const loadingContainerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  };
  
  const editBadgeStyle = {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6',
    width: size * 0.3,
    height: size * 0.3,
    borderRadius: size * 0.15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  };
  
  // Handle image content based on loading state and avatar type
  let imageContent;
  
  if (loading) {
    // Show loading indicator
    imageContent = (
      <View style={loadingContainerStyle}>
        <ActivityIndicator size={size > 100 ? "large" : "small"} color="#8B5CF6" />
      </View>
    );
  } else if (avatarType === 'initial') {
    // Use InitialAvatar for initial type avatars
    imageContent = (
      <InitialAvatar 
        name={userName} 
        size={size} 
        style={{ borderWidth: 3, borderColor: '#8B5CF6' }}
      />
    );
  } else if (localImage) {
    // Use local image if provided
    imageContent = (
      <Image
        source={localImage}
        style={avatarStyle}
      />
    );
  } else {
    // Default to remote URL
    imageContent = (
      <Image
        source={{ uri: avatarUrl || defaultAvatar }}
        style={avatarStyle}
      />
    );
  }
  
  // Render with or without onPress handler
  return onPress ? (
    <TouchableOpacity style={containerStyle} onPress={onPress} disabled={loading}>
      {imageContent}
      {showEditButton && !loading && (
        <View style={editBadgeStyle}>
          <FontAwesome5 name="camera" size={size * 0.12} color="white" />
        </View>
      )}
    </TouchableOpacity>
  ) : (
    <View style={containerStyle}>
      {imageContent}
      {showEditButton && !loading && (
        <View style={editBadgeStyle}>
          <FontAwesome5 name="camera" size={size * 0.12} color="white" />
        </View>
      )}
    </View>
  );
};

export default UserAvatar; 