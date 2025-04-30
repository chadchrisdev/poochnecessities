import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../src/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { createInitialAvatar, svgToDataUri } from '../src/utils/createInitialAvatar';
import InitialAvatar from '../src/components/InitialAvatar';

const CreateAccountScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatar, setAvatar] = useState(null); // Uploaded image
  const [initialAvatarDataUri, setInitialAvatarDataUri] = useState(null);
  const [avatarType, setAvatarType] = useState(null); // 'uploaded' or 'initial'
  const [formErrors, setFormErrors] = useState({});
  const [imageError, setImageError] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  // Generate initial avatar when name changes
  useEffect(() => {
    if (formData.fullName) {
      const svgString = createInitialAvatar(formData.fullName);
      const dataUri = svgToDataUri(svgString);
      setInitialAvatarDataUri(dataUri);
      
      // Auto-set the avatar if one isn't already set
      if (!avatar && avatarType !== 'uploaded') {
        setAvatarType('initial');
      }
    }
  }, [formData.fullName]);

  // Handle input change
  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user edits a field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  // Pick an image from library
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Please grant permission to access your photo library to add a profile photo.'
        );
        return;
      }

      // Launch image picker with reduced quality for better performance
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduced quality to prevent network issues
        base64: false, // We'll use direct file upload instead of base64
      });

      // Handle cancellation
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Image picking was cancelled');
        return;
      }

      // Set the selected image
      const selectedImage = result.assets[0];
      
      // Check file size - warn if image is large
      if (selectedImage.fileSize && selectedImage.fileSize > 2 * 1024 * 1024) { // > 2MB
        Alert.alert(
          'Large Image', 
          'The selected image is quite large, which might cause upload issues. Would you like to select a smaller image?',
          [
            { text: 'Select Another', onPress: () => pickImage() },
            { text: 'Continue Anyway', onPress: () => {
              setAvatar(selectedImage);
              setAvatarType('uploaded');
            }}
          ]
        );
      } else {
        setAvatar(selectedImage);
        setAvatarType('uploaded');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Image Selection Error', 
        'There was a problem selecting your image. Please try again.'
      );
    }
  };

  // Reset to initial avatar
  const handleResetToInitialAvatar = () => {
    if (initialAvatarDataUri) {
      setAvatar(null);
      setAvatarType('initial');
      
      // Clear any avatar error
      if (formErrors.avatar) {
        setFormErrors({
          ...formErrors,
          avatar: null,
        });
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Required field validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    // Avatar validation
    if (avatarType !== 'uploaded' && avatarType !== 'initial') {
      errors.avatar = 'Profile photo is required';
    }

    // Optional field validation
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (userId) => {
    try {
      // Handle initial avatar
      if (avatarType === 'initial') {
        // For initial avatars, we just return the type
        // The actual avatar will be generated at runtime
        return {
          url: null, // Don't store a URL for initial avatars
          type: 'initial',
          id: null
        };
      }
      
      // Handle uploaded avatar
      if (avatarType === 'uploaded' && avatar) {
        // Create the file name
        const fileExt = avatar.uri.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        console.log('Creating avatar with name:', fileName);
        
        // Direct upload method using fetch and FormData
        try {
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('file', {
            uri: avatar.uri,
            name: fileName,
            type: `image/${fileExt}`
          });
          
          // Direct upload to Supabase Storage
          const response = await fetch(`${supabase.supabaseUrl}/storage/v1/object/avatars/${fileName}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabase.supabaseKey}`,
              'Content-Type': 'multipart/form-data',
              'x-upsert': 'true'
            },
            body: formData
          });
          
          if (!response.ok) {
            throw new Error('Failed to upload avatar');
          }
          
          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
            
          console.log('Avatar uploaded successfully:', urlData.publicUrl);
          return {
            url: urlData.publicUrl,
            type: 'uploaded',
            id: null
          };
        } catch (uploadError) {
          console.error('Error with direct upload:', uploadError);
          throw uploadError;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert(
        'Avatar Upload Failed', 
        'We couldn\'t upload your profile picture. Your account has been created, but you\'ll need to add a profile photo later.'
      );
      return null;
    }
  };

  // Render avatar preview
  const renderAvatarPreview = () => {
    if (avatarType === 'uploaded' && avatar) {
      return <Image source={{ uri: avatar.uri }} style={styles.avatar} />;
    } else if (avatarType === 'initial') {
      // Use our custom component to render the initial avatar directly
      return <InitialAvatar name={formData.fullName} style={styles.avatar} />;
    } else {
      return (
        <View style={styles.avatarPlaceholder}>
          <FontAwesome5 name="user" size={40} color="#CBD5E1" />
        </View>
      );
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields and correct any errors.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData?.user) {
        throw new Error('Failed to create user');
      }
      
      // 2. Upload avatar if selected
      let avatarResult = null;
      
      if (avatarType) {
        avatarResult = await uploadAvatar(authData.user.id);
      }
      
      // 3. Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();
      
      let profileError;
      
      // Create profile data object
      const profileData = {
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone || null,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      };
      
      // Add avatar data if available
      if (avatarResult) {
        profileData.avatar_url = avatarResult.url;
        profileData.avatar_type = avatarResult.type;
      }
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('users')
          .update(profileData)
          .eq('id', authData.user.id);
          
        profileError = error;
      } else {
        // Insert new profile
        profileData.created_at = new Date().toISOString();
        profileData.id = authData.user.id;
        
        const { error } = await supabase
          .from('users')
          .insert([profileData]);
          
        profileError = error;
      }
        
      if (profileError) throw profileError;
      
      // Success message with clear next steps
      Alert.alert(
        'Account Created',
        'Your account has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: async () => {
              try {
                // Attempt to sign in with the new credentials
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                  email: formData.email,
                  password: formData.password,
                });
                
                if (signInError) {
                  // Show error and go to login if sign-in fails
                  Alert.alert('Sign In Failed', signInError.message);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                } else {
                  // On successful sign-in, navigate to onboarding flow
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'OnboardingWelcome' }],
                  });
                }
              } catch (err) {
                // Handle unexpected errors
                Alert.alert('Error', 'An unexpected error occurred.');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error signing up:', error);
      setLoading(false);
      
      if (error.message?.includes('duplicate key')) {
        Alert.alert('Error', 'An account with this email already exists.');
      } else {
        Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
      }
    }
  };

  // Go back to login screen
  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Profile</Text>
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Avatar Upload */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
              {renderAvatarPreview()}
              <View style={styles.avatarBadge}>
                <FontAwesome5 name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.avatarText}>
              {avatarType ? 'Tap to change photo' : 'Upload Profile Photo'}
            </Text>
            
            {/* Reset to initial avatar button (only show if using uploaded avatar) */}
            {avatarType === 'uploaded' && (
              <TouchableOpacity 
                style={styles.placeholderButton}
                onPress={handleResetToInitialAvatar}
              >
                <Text style={styles.placeholderButtonText}>Use Initial Avatar</Text>
              </TouchableOpacity>
            )}
            
            {formErrors.avatar && (
              <Text style={styles.errorText}>{formErrors.avatar}</Text>
            )}
          </View>
          
          {/* Form */}
          <View style={styles.formSection}>
            {/* Personal Information */}
            <View style={styles.formGroup}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={[styles.input, formErrors.fullName && styles.inputError]}
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChangeText={(text) => handleChange('fullName', text)}
                  autoCapitalize="words"
                />
                {formErrors.fullName && (
                  <Text style={styles.errorText}>{formErrors.fullName}</Text>
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, formErrors.email && styles.inputError]}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {formErrors.email && (
                  <Text style={styles.errorText}>{formErrors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.passwordInput,
                      formErrors.password && styles.inputError
                    ]}
                    placeholder="Enter password"
                    value={formData.password}
                    onChangeText={(text) => handleChange('password', text)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesome5 
                      name={showPassword ? "eye-slash" : "eye"} 
                      size={18} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                {formErrors.password && (
                  <Text style={styles.errorText}>{formErrors.password}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.passwordInput,
                      formErrors.confirmPassword && styles.inputError
                    ]}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleChange('confirmPassword', text)}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <FontAwesome5 
                      name={showConfirmPassword ? "eye-slash" : "eye"} 
                      size={18} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                {formErrors.confirmPassword && (
                  <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>
                )}
              </View>
            </View>
            
            {/* Optional Information */}
            <View style={styles.formGroup}>
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
            </View>
            
            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Create Profile</Text>
              )}
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  formSection: {
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputRowItem: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  placeholderButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CreateAccountScreen; 