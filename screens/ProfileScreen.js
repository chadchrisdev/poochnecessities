import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../src/lib/supabase';
import { pickAndUploadAvatar } from '../src/utils/pickAndUploadAvatar';
import UserAvatar from '../src/components/UserAvatar';
import AvatarSelector from '../src/components/AvatarSelector';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  useEffect(() => {
    fetchProfile();
    
    // Listen for focus events to refresh data when returning from EditProfileScreen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Function to fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle avatar upload
  const handleAvatarUpload = async () => {
    // Show the avatar selector modal
    setShowAvatarModal(true);
  };
  
  // Handle avatar change from the selector
  const handleAvatarChange = async (newAvatarUrl, newAvatarType) => {
    try {
      // Update user profile with the new avatar
      const { error } = await supabase
        .from('users')
        .update({ 
          avatar_url: newAvatarUrl,
          avatar_type: newAvatarType 
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        avatar_url: newAvatarUrl,
        avatar_type: newAvatarType
      }));
      
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
    }
  };
  
  // Function to handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Sign out error:', error.message);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          <FontAwesome5 name="edit" size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <UserAvatar
            avatarUrl={profile.avatar_url}
            userName={profile.full_name}
            avatarType={profile.avatar_type}
            size={120}
            onPress={() => setShowAvatarModal(true)}
          />
          
          <Text style={styles.userName}>
            {profile?.first_name ? 
              `${profile.first_name} ${profile.last_name || ''}` : 
              profile?.full_name || 'User'}
          </Text>
          
          <Text style={styles.userEmail}>{profile?.email}</Text>
        </View>
        
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('DogsTab')}>
            <FontAwesome5 name="paw" size={20} color="#8B5CF6" style={styles.actionIcon} />
            <Text style={styles.actionText}>My Dogs</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" style={styles.actionArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <FontAwesome5 name="bell" size={20} color="#8B5CF6" style={styles.actionIcon} />
            <Text style={styles.actionText}>Notifications</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" style={styles.actionArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <FontAwesome5 name="cog" size={20} color="#8B5CF6" style={styles.actionIcon} />
            <Text style={styles.actionText}>Settings</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" style={styles.actionArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <FontAwesome5 name="question-circle" size={20} color="#8B5CF6" style={styles.actionIcon} />
            <Text style={styles.actionText}>Help & Support</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" style={styles.actionArrow} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <FontAwesome5 name="sign-out-alt" size={16} color="#EF4444" style={styles.buttonIcon} />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
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
            
            {profile && (
              <AvatarSelector
                userId={profile.id}
                currentAvatarUrl={profile.avatar_url}
                currentAvatarType={profile.avatar_type}
                userName={profile.full_name}
                onAvatarChange={(newUrl, newType) => {
                  handleAvatarChange(newUrl, newType);
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  actionArrow: {
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 24,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  buttonIcon: {
    marginRight: 8,
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

export default ProfileScreen; 