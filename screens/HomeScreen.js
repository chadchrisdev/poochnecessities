import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image
} from 'react-native';
import { FontAwesome5, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import UserAvatar from '../src/components/UserAvatar';
import { format } from 'date-fns';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dogs, setDogs] = useState([]);
  const [dogsLoading, setDogsLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [upcomingActivitiesLoading, setUpcomingActivitiesLoading] = useState(true);
  
  // Function to get the appropriate greeting based on time of day
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    
    if (currentHour < 12) {
      return 'Good Morning';
    } else if (currentHour < 18) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.warn('Error fetching user profile:', error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Fetch user's dogs from Supabase
  const fetchDogs = async () => {
    try {
      setDogsLoading(true);
      
      if (!user) {
        return;
      }
      
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Error fetching dogs:', error);
        return;
      }
      
      setDogs(data || []);
    } catch (error) {
      console.error('Unexpected error fetching dogs:', error);
    } finally {
      setDogsLoading(false);
    }
  };
  
  // Fetch recent activities from Supabase for today
  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      
      if (!user) {
        return;
      }
      
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          dogs(id, name, photo_url)
        `)
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }
      
      // Process data to transform it for UI
      const processedActivities = (data || []).map(activity => {
        let dogName = 'Unknown Dog';
        let dogPhoto = null;
        
        if (activity.dogs) {
          dogName = activity.dogs.name || 'Unknown Dog';
          dogPhoto = activity.dogs.photo_url;
        }
        
        return {
          ...activity,
          dog_name: dogName,
          dog_photo: dogPhoto
        };
      });
      
      setActivities(processedActivities);
    } catch (error) {
      console.error('Unexpected error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };
  
  // Load data when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchDogs();
      fetchRecentActivities();
    }
  }, [user]);
  
  // Format time for display (e.g., "8:30 AM • 25 mins")
  const formatActivityTime = (startTime, duration) => {
    try {
      const date = new Date(startTime);
      let formattedTime = format(date, 'h:mm a');
      
      if (duration) {
        formattedTime += ` • ${duration} mins`;
      }
      
      return formattedTime;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Unknown time';
    }
  };
  
  // Get the appropriate emoji and background color for activity type
  const getActivityIconInfo = (activityType) => {
    switch(activityType?.toLowerCase()) {
      case 'walk':
        return { emoji: '🐾', bgColor: '#F3E8FF' };
      case 'feeding':
      case 'feed':
        return { emoji: '🍽️', bgColor: '#DBEAFE' };
      case 'play':
        return { emoji: '🎾', bgColor: '#D1FAE5' };
      case 'pee':
        return { emoji: '💧', bgColor: '#FEF3C7' };
      case 'poop':
        return { emoji: '💩', bgColor: '#FEE2E2' };
      case 'medication':
      case 'meds':
        return { emoji: '💊', bgColor: '#FCE7F3' };
      default:
        return { emoji: '🐶', bgColor: '#F3F4F6' };
    }
  };
  
  // Get a readable title for the activity
  const getActivityTitle = (activity) => {
    const type = activity.activity_type?.toLowerCase();
    
    switch(type) {
      case 'walk':
        return 'Walk';
      case 'feeding':
      case 'feed':
        return 'Feeding';
      case 'play':
        return 'Play Time';
      case 'pee':
        return 'Potty Break (Pee)';
      case 'poop':
        return 'Potty Break (Poop)';
      case 'medication':
      case 'meds':
        return 'Medication';
      default:
        // Capitalize the first letter
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Activity';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pooch Necessities</Text>
        <View style={styles.headerIcons}>
          <FontAwesome5 name="bell" size={20} color="#4B5563" style={styles.icon} />
          <FontAwesome5 name="cog" size={20} color="#4B5563" />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroContent}>
              <UserAvatar 
                avatarUrl={profile?.avatar_url}
                size={60}
                onPress={() => navigation.navigate('ProfileTab')}
                style={{ marginRight: 16 }}
                userName={profile?.full_name || ''}
                avatarType={profile?.avatar_url ? 'uploaded' : 'initial'}
              />
              <View>
                <Text style={styles.greeting}>
                  {getTimeBasedGreeting()}, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Friend'}!
                </Text>
                <Text style={styles.dogStatus}>
                  {dogs.length > 0 
                    ? `You have ${dogs.length} ${dogs.length === 1 ? 'dog' : 'dogs'} 🐾` 
                    : 'Add your dogs to get started 🐾'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Access Menu */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              {/* Walk Tile */}
              <TouchableOpacity 
                style={styles.quickAccessTile}
                onPress={() => navigation.navigate('AddWalk')}
              >
                <View style={styles.tileIconContainer}>
                  <FontAwesome5 name="map-marker-alt" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.tileText}>Walk</Text>
              </TouchableOpacity>
              
              {/* Pee Tile */}
              <TouchableOpacity 
                style={styles.quickAccessTile}
                onPress={() => navigation.navigate('LogActivity', { activityType: 'Pee' })}
              >
                <View style={styles.tileIconContainer}>
                  <FontAwesome5 name="tint" size={24} color="#FBBF24" />
                </View>
                <Text style={styles.tileText}>Pee</Text>
              </TouchableOpacity>
              
              {/* Poop Tile */}
              <TouchableOpacity 
                style={styles.quickAccessTile}
                onPress={() => navigation.navigate('LogActivity', { activityType: 'Poop' })}
              >
                <View style={styles.tileIconContainer}>
                  <Text style={styles.emojiIcon}>💩</Text>
                </View>
                <Text style={styles.tileText}>Poop</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Activities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Recent Activities</Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('ActivitiesTab')}
              >
                <Text style={styles.buttonText}>Log Activity</Text>
              </TouchableOpacity>
            </View>
            
            {/* Activity Cards */}
            <View style={styles.activityList}>
              {activitiesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={styles.loadingText}>Loading activities...</Text>
                </View>
              ) : activities.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>No activities recorded today.</Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => navigation.navigate('ActivitiesTab')}
                  >
                    <Text style={styles.emptyStateButtonText}>Log Your First Activity</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                activities.map((activity, index) => {
                  const { emoji, bgColor } = getActivityIconInfo(activity.activity_type);
                  return (
                    <TouchableOpacity 
                      key={activity.id || index} 
                      style={styles.activityCard}
                      onPress={() => navigation.navigate('ActivityDetails', { activityId: activity.id })}
                    >
                      <View style={[styles.activityIcon, { backgroundColor: bgColor }]}>
                        <Text style={styles.activityEmoji}>{emoji}</Text>
                      </View>
                      <View style={styles.activityDetails}>
                        <Text style={styles.activityTitle}>
                          {getActivityTitle(activity)}
                          {activity.dog_name !== 'Unknown Dog' && ` • ${activity.dog_name}`}
                        </Text>
                        <Text style={styles.activityTime}>
                          {formatActivityTime(activity.start_time, activity.duration_minutes)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          {/* AI Insights */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Insights</Text>
            </View>
            <LinearGradient
              colors={['#8b5cf6', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiInsightCard}
            >
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text style={styles.aiTitle}>Smart Recommendations</Text>
              </View>
              <Text style={styles.aiText}>
                No insights available yet. Continue logging your pet's activities to receive personalized recommendations.
              </Text>
              <TouchableOpacity style={styles.aiButton}>
                <Text style={{ color: '#8B5CF6', fontWeight: '500' }}>Learn More</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Dogs Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Dogs</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('DogsTab')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <FontAwesome5 name="chevron-right" size={12} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            <View style={styles.dogsList}>
              {dogsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={styles.loadingText}>Loading dogs...</Text>
                </View>
              ) : dogs.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>No dogs added yet.</Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => navigation.navigate('AddDog')}
                  >
                    <Text style={styles.emptyStateButtonText}>Add Your Dog</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.dogsGrid}>
                  {dogs.slice(0, 3).map((dog) => (
                    <TouchableOpacity 
                      key={dog.id} 
                      style={styles.dogCard}
                      onPress={() => navigation.navigate('DogProfile', { dogId: dog.id })}
                    >
                      <View style={styles.dogAvatar}>
                        {dog.photo_url ? (
                          <Image source={{ uri: dog.photo_url }} style={styles.dogImage} />
                        ) : (
                          <FontAwesome5 name="dog" size={24} color="#8B5CF6" />
                        )}
                      </View>
                      <Text style={styles.dogName}>{dog.name}</Text>
                      <Text style={styles.dogBreed}>{dog.breed}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Add Dog Profiles Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('DogsTab')}
            >
              <Text style={styles.actionButtonText}>Manage Dog Profiles</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom padding for content */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    marginRight: 16,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
    marginBottom: 2,
  },
  dogStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAccessTile: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  emojiIcon: {
    fontSize: 24,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  activityList: {
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  aiInsightCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aiTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  aiText: {
    color: 'white',
    marginBottom: 12,
  },
  aiButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  dogsList: {
    marginTop: 4,
  },
  dogCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dogAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dogImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  dogName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  dogBreed: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  dogsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  emptyStateContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen; 