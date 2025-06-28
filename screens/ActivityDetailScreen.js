import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { format, parseISO } from 'date-fns';
import ActivityIcon from '../src/components/ActivityIcon';
import { navigateToActivityEdit } from '../src/utils/activityNavigationHelper';

const ActivityDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { activityId } = route.params;
  
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dog, setDog] = useState(null);
  
  useEffect(() => {
    fetchActivity();
  }, [activityId]);
  
  const fetchActivity = async () => {
    try {
      setLoading(true);
      
      if (!activityId) {
        Alert.alert('Error', 'Activity ID is missing');
        navigation.goBack();
        return;
      }
      
      // Fetch activity with dog information
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          dogs (
            id,
            name,
            breed,
            photo_url
          )
        `)
        .eq('id', activityId)
        .single();
      
      if (error) {
        console.error('Error fetching activity:', error);
        Alert.alert('Error', 'Failed to load activity details');
        return;
      }
      
      if (!data) {
        Alert.alert('Error', 'Activity not found');
        navigation.goBack();
        return;
      }
      
      setActivity(data);
      setDog(data.dogs);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date/time for display
  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return 'Unknown';
      const date = parseISO(dateString);
      return format(date, 'MMMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Get activity type label
  const getActivityTypeLabel = (type) => {
    if (!type) return 'Activity';
    
    const activityType = type.toLowerCase();
    
    switch (activityType) {
      case 'walk':
        return 'Walk';
      case 'feeding':
      case 'feed':
        return 'Feeding';
      case 'pee':
        return 'Pee';
      case 'poop':
        return 'Poop';
      case 'medication':
      case 'meds':
        return 'Medication';
      case 'vet':
        return 'Vet Visit';
      case 'play':
        return 'Play Time';
      case 'grooming':
        return 'Grooming';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Navigate to edit screen
  const handleEditActivity = () => {
    navigateToActivityEdit(navigation, activityId, activity?.activity_type);
  };
  
  // Show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading activity details...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditActivity}
        >
          <FontAwesome5 name="edit" size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Activity Type Header */}
        <View style={styles.activityHeader}>
          <View style={styles.activityIconContainer}>
            <ActivityIcon type={activity?.activity_type} size={32} />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>
              {getActivityTypeLabel(activity?.activity_type)}
            </Text>
            <Text style={styles.activityTime}>
              {formatDateTime(activity?.start_time)}
            </Text>
          </View>
        </View>
        
        {/* Dog Information */}
        {dog && (
          <View style={styles.dogSection}>
            <Text style={styles.sectionTitle}>Dog</Text>
            <View style={styles.dogInfo}>
              {dog.photo_url ? (
                <Image 
                  source={{ uri: dog.photo_url }} 
                  style={styles.dogAvatar} 
                />
              ) : (
                <View style={styles.dogAvatarPlaceholder}>
                  <FontAwesome5 name="dog" size={24} color="#8B5CF6" />
                </View>
              )}
              <View style={styles.dogDetails}>
                <Text style={styles.dogName}>{dog.name}</Text>
                {dog.breed && <Text style={styles.dogBreed}>{dog.breed}</Text>}
              </View>
            </View>
          </View>
        )}
        
        {/* Duration (for walks) */}
        {activity?.duration_minutes && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={18} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>{activity.duration_minutes} minutes</Text>
            </View>
          </View>
        )}
        
        {/* Distance (for walks) */}
        {activity?.distance_meters && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Distance</Text>
            <View style={styles.detailRow}>
              <FontAwesome5 name="route" size={18} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {(activity.distance_meters / 1000).toFixed(2)} km
              </Text>
            </View>
          </View>
        )}
        
        {/* Notes */}
        {activity?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notes}>{activity.notes}</Text>
            </View>
          </View>
        )}
        
        {/* Created Time */}
        <View style={styles.metaSection}>
          <Text style={styles.metaText}>
            Created: {formatDateTime(activity?.created_at || activity?.start_time)}
          </Text>
        </View>
      </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 16,
    color: '#6B7280',
  },
  dogSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  dogInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dogAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  dogAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dogDetails: {
    flex: 1,
  },
  dogName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  dogBreed: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#1F2937',
  },
  notesSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notesContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  notes: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  metaSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default ActivityDetailScreen; 