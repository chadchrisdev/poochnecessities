import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../src/lib/supabase';
import { pickAndUploadAvatar } from '../src/utils/pickAndUploadAvatar';
import { useAuth } from '../src/context/AuthContext';
import { createInitialAvatar, svgToDataUri } from '../src/utils/createInitialAvatar';
import InitialAvatar from '../src/components/InitialAvatar';

const ProfileSetupScreen = () => {
  const navigation = useNavigation();
  const { refreshProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [initialAvatarDataUri, setInitialAvatarDataUri] = useState(null);
  const [imageError, setImageError] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    alternate_email: '',
    avatar_url: null,
    avatar_type: null, // 'uploaded' or 'initial'
  });

  // Generate initial avatar when name changes
  useEffect(() => {
    if (formData.full_name) {
      const svgString = createInitialAvatar(formData.full_name);
      const dataUri = svgToDataUri(svgString);
      setInitialAvatarDataUri(dataUri);
      
      // Auto-set the avatar if one isn't already set
      if (!formData.avatar_url || formData.avatar_type === 'initial') {
        setFormData(prev => ({
          ...prev,
          avatar_url: dataUri,
          avatar_type: 'initial'
        }));
      }
    }
  }, [formData.full_name]);

  useEffect(() => {
    // Load any existing user data on component mount
    const loadUserData = async () => {
      try {
        if (!user) return;
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            phone: data.phone || '',
            alternate_email: data.alternate_email || '',
            avatar_url: data.avatar_url,
            avatar_type: data.avatar_type || null,
          });
          
          // If previously using placeholder, switch to initial avatar
          if (data.avatar_type === 'placeholder' && data.full_name) {
            const svgString = createInitialAvatar(data.full_name);
            const dataUri = svgToDataUri(svgString);
            setInitialAvatarDataUri(dataUri);
            
            // Only auto-update if they were using a placeholder before
            setFormData(prev => ({
              ...prev,
              avatar_url: dataUri,
              avatar_type: 'initial'
            }));
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error.message);
      }
    };
    
    loadUserData();
  }, [user]);
  
  // Handle form field changes
  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };
  
  // Handle avatar upload
  const handleAvatarUpload = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      setUploadingImage(true);
      
      // Request permissions and pick image
      const { avatarUrl, error } = await pickAndUploadAvatar(user.id);
      
      if (error) {
        Alert.alert('Error', 'Failed to upload avatar. Please try again.');
        return;
      }
      
      if (avatarUrl) {
        setFormData(prev => ({
          ...prev,
          avatar_url: avatarUrl,
          avatar_type: 'uploaded',
        }));
        
        // Clear any avatar error
        if (formErrors.avatar_url) {
          setFormErrors({
            ...formErrors,
            avatar_url: null,
          });
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Reset to initial avatar
  const handleResetToInitialAvatar = () => {
    if (initialAvatarDataUri) {
      setFormData(prev => ({
        ...prev,
        avatar_url: initialAvatarDataUri,
        avatar_type: 'initial',
      }));
      
      // Clear any avatar error
      if (formErrors.avatar_url) {
        setFormErrors({
          ...formErrors,
          avatar_url: null,
        });
      }
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'Name is required';
    }
    
    if (!formData.avatar_url) {
      errors.avatar_url = 'Profile photo is required';
    }
    
    // Email validation for alternate email (if provided)
    if (formData.alternate_email && !/\S+@\S+\.\S+/.test(formData.alternate_email)) {
      errors.alternate_email = 'Please enter a valid email address';
    }
    
    // Phone validation (if provided)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      Alert.alert('Validation Error', 'Please fill in all required fields and correct any errors.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create user profile data to save
      const profileData = {
        full_name: formData.full_name,
        phone: formData.phone || null,
        alternate_email: formData.alternate_email || null,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };
      
      // Add avatar data based on type
      if (formData.avatar_type === 'initial') {
        // For initial avatars, we only store the type as 'initial'
        // The actual avatar will be generated at runtime using the user's name
        // This is more reliable than storing a potentially problematic data URI
        profileData.avatar_type = 'initial';
        profileData.avatar_url = null; // We don't need to store the URL
      } else if (formData.avatar_type === 'uploaded') {
        // For uploaded avatars, store the URL
        profileData.avatar_url = formData.avatar_url;
        profileData.avatar_type = 'uploaded';
      }
      
      // Update profile in users table
      const { error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Refresh user profile in context
      await refreshProfile();
      
      // Navigate to onboarding add dog screen
      navigation.navigate('OnboardingAddDog');
    } catch (error) {
      console.error('Error saving profile:', error.message);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render avatar preview based on type
  const renderAvatarPreview = () => {
    if (formData.avatar_url) {
      if (formData.avatar_type === 'initial') {
        // For initial avatars, render our component directly instead of an image
        return <InitialAvatar name={formData.full_name} style={styles.avatar} />;
      }
      
      // For uploaded avatars, use the image
      return (
        <Image 
          source={{ uri: formData.avatar_url }} 
          style={styles.avatar} 
          key={`avatar-${formData.avatar_type}-${Date.now()}`}
        />
      );
    }
    
    // No avatar - show placeholder
    return (
      <View style={styles.avatarPlaceholder}>
        <FontAwesome5 name="user-alt" size={40} color="#CBD5E1" />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Complete Your Profile</Text>
            <Text style={styles.headerSubtitle}>
              Let's set up your profile so you can get the most out of Pooch Necessities
            </Text>
          </View>
          
          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleAvatarUpload}
              disabled={uploadingImage}
            >
              {renderAvatarPreview()}
              
              <View style={styles.avatarBadge}>
                <FontAwesome5 name="camera" size={14} color="white" />
              </View>
              
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={styles.avatarText}>
              {formData.avatar_url ? 'Tap to change photo' : 'Add profile photo'}
            </Text>
            
            {/* Reset to initial avatar button (only show if using uploaded avatar) */}
            {formData.avatar_type === 'uploaded' && (
              <TouchableOpacity 
                style={styles.placeholderButton}
                onPress={handleResetToInitialAvatar}
              >
                <Text style={styles.placeholderButtonText}>Use Initial Avatar</Text>
              </TouchableOpacity>
            )}
            
            {formErrors.avatar_url && (
              <Text style={styles.errorText}>{formErrors.avatar_url}</Text>
            )}
          </View>
          
          {/* Required Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Required Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, formErrors.full_name && styles.inputError]}
                placeholder="Enter your name"
                value={formData.full_name}
                onChangeText={(text) => handleChange('full_name', text)}
                autoCapitalize="words"
              />
              {formErrors.full_name && (
                <Text style={styles.errorText}>{formErrors.full_name}</Text>
              )}
            </View>
          </View>
          
          {/* Optional Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Optional Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, formErrors.phone && styles.inputError]}
                placeholder="(123) 456-7890"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                keyboardType="phone-pad"
              />
              {formErrors.phone && (
                <Text style={styles.errorText}>{formErrors.phone}</Text>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Alternate Email</Text>
              <TextInput
                style={[styles.input, formErrors.alternate_email && styles.inputError]}
                placeholder="alternate@example.com"
                value={formData.alternate_email}
                onChangeText={(text) => handleChange('alternate_email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {formErrors.alternate_email && (
                <Text style={styles.errorText}>{formErrors.alternate_email}</Text>
              )}
            </View>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    overflow: 'visible',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
    marginBottom: 8,
  },
  placeholderButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileSetupScreen; 