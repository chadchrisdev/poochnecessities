import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Alert,
  SafeAreaView,
  Modal
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { pickAndUploadAvatar } from '../src/utils/pickAndUploadAvatar';
import UserAvatar from '../src/components/UserAvatar';
import AvatarSelector from '../src/components/AvatarSelector';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error.message);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const updates = {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        // Keep full_name in sync for backward compatibility
        full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      };
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Update error:', error.message);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = () => {
    // Show the avatar selector modal
    setShowAvatarModal(true);
  };
  
  // Handle avatar change from the selector
  const handleAvatarChange = (newAvatarUrl) => {
    if (newAvatarUrl) {
      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 20 }} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              size={120}
              onPress={handleAvatarUpload}
              loading={uploadingImage}
              showEditButton={true}
            />
            <Text style={styles.avatarText}>Tap to change avatar</Text>
          </View>
          
          {/* Form Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={profile.first_name || ''}
              onChangeText={(text) => setProfile({ ...profile, first_name: text })}
              placeholder="Enter your first name"
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={profile.last_name || ''}
              onChangeText={(text) => setProfile({ ...profile, last_name: text })}
              placeholder="Enter your last name"
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile.email || ''}
              editable={false}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
          
          {/* Save Button */}
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (loading || uploadingImage || !profile.first_name) && styles.saveButtonDisabled
            ]}
            onPress={updateProfile}
            disabled={loading || uploadingImage || !profile.first_name}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Avatar Selector Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <FontAwesome5 name="times" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            {profile && profile.id && (
              <AvatarSelector
                userId={profile.id}
                currentAvatarUrl={profile.avatar_url}
                onAvatarChange={(newUrl) => {
                  handleAvatarChange(newUrl);
                  setShowAvatarModal(false);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default EditProfileScreen; 