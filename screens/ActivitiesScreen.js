import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { format, subDays } from 'date-fns';
import { BlurView } from 'expo-blur';

/**
 * ActivitiesScreen Component
 * 
 * Database requirements:
 * - activities table must have a dog_id column (UUID)
 * - dog_id must have a foreign key constraint referencing dogs.id
 * - SQL: ALTER TABLE activities ADD COLUMN IF NOT EXISTS dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL;
 */

const ActivitiesScreen = () => {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // New state variables for filter modals
  const [dogFilterModalVisible, setDogFilterModalVisible] = useState(false);
  const [activityFilterModalVisible, setActivityFilterModalVisible] = useState(false);
  const [dateFilterModalVisible, setDateFilterModalVisible] = useState(false);
  
  // State for selected filter values
  const [selectedDog, setSelectedDog] = useState(null);
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  
  // State for filter display labels
  const [selectedDogLabel, setSelectedDogLabel] = useState('All Dogs');
  const [selectedActivityTypeLabel, setSelectedActivityTypeLabel] = useState('All Activities');
  const [selectedDateRangeLabel, setSelectedDateRangeLabel] = useState('Date Range');

  // State for dogs data from Supabase
  const [dogs, setDogs] = useState([]);
  const [dogsLoading, setDogsLoading] = useState(true);

  // Animation state
  const [overlayOpacity] = useState(new Animated.Value(0));

  // Animation helper functions
  const openModalAnimation = () => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeModalAnimation = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const activityFilters = [
    { id: 'all', label: 'All Activities', icon: 'list' },
    { id: 'walk', label: 'Walks', icon: 'walking' },
    { id: 'pee', label: 'Pee', icon: 'tint' },
    { id: 'poop', label: 'Poop', icon: 'poop' },
    { id: 'feeding', label: 'Feeding', icon: 'utensils' },
    { id: 'medication', label: 'Medication', icon: 'pills' },
  ];

  // Fetch dogs from Supabase
  const fetchDogs = async () => {
    try {
      setDogsLoading(true);
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

  // Load dogs when component mounts
  useEffect(() => {
    fetchDogs();
  }, []);

  // Modified to apply all filters
  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Start with the base query - modified to join with dogs table using foreign key
      let query = supabase
        .from('activities')
        .select(`
          *,
          dogs(id, name)
        `)
        /* Alternative format:
          .select(`
            *,
            dog:dogs(name)
          `)
        */
        .order('start_time', { ascending: false })
        // Filter out walk activities
        .neq('activity_type', 'walk');
      
      // Apply dog filter if selected
      if (selectedDog) {
        // Filter by dog name using the proper foreign key relationship
        query = query.eq('dogs.name', selectedDog);
      }
      
      // Apply activity type filter if selected
      if (selectedActivityType && selectedActivityType !== 'all') {
        query = query.eq('activity_type', selectedActivityType);
      }
      
      // Apply date range filter if selected
      if (selectedDateRange) {
        query = query
          .gte('created_at', selectedDateRange.startDate.toISOString())
          .lte('created_at', selectedDateRange.endDate.toISOString());
      }
      
      // Execute the query
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        Alert.alert('Error', 'Unable to load activity history');
        return;
      }

      // Process data to add dog_name from the joined dogs table
      const processedData = (data || []).map(activity => {
        // Get dog name from the dogs relation
        let dogName = 'Unknown Dog';
        
        if (activity.dogs && activity.dogs.length > 0 && activity.dogs[0].name) {
          // With proper foreign key, dogs will be an array with the joined dog data
          dogName = activity.dogs[0].name;
        } else if (activity.dog_id && activity.dogs && activity.dogs.length === 0) {
          // Dog ID exists but no dog found - may have been deleted
          dogName = 'Unknown Dog';
        } else if (!activity.dog_id) {
          // No dog assigned to this activity
          dogName = 'No Dog Assigned';
        }
        
        return {
          ...activity,
          dog_name: dogName
        };
      });

      setActivities(processedData);
      setFilteredActivities(processedData);
    } catch (error) {
      console.error('Unexpected error fetching activities:', error);
      Alert.alert('Error', 'Something went wrong while loading activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh activities when filters change
  useEffect(() => {
    fetchActivities();
  }, [selectedDog, selectedActivityType, selectedDateRange]);

  // Initial load
  useEffect(() => {
    fetchActivities();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
  }, []);

  // Apply dog filter using real dog data
  const applyDogFilter = (dogName) => {
    setSelectedDog(dogName === 'All Dogs' ? null : dogName);
    setSelectedDogLabel(dogName);
    closeModalAnimation();
    setTimeout(() => setDogFilterModalVisible(false), 200);
  };

  // Apply activity type filter (mock)
  const applyActivityTypeFilter = (activityType, label) => {
    setSelectedActivityType(activityType === 'all' ? null : activityType);
    setSelectedActivityTypeLabel(label);
    closeModalAnimation();
    setTimeout(() => setActivityFilterModalVisible(false), 200);
  };

  // Apply date range filter (mock)
  const applyDateRangeFilter = (rangeType) => {
    const today = new Date();
    let startDate, endDate;

    switch (rangeType) {
      case 'Today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date();
        break;
      case 'This Week':
        startDate = subDays(today, 7);
        endDate = new Date();
        break;
      case 'This Month':
        startDate = subDays(today, 30);
        endDate = new Date();
        break;
      default:
        startDate = null;
        endDate = null;
    }

    if (startDate && endDate) {
      setSelectedDateRange({ startDate, endDate });
      setSelectedDateRangeLabel(rangeType);
    } else {
      setSelectedDateRange(null);
      setSelectedDateRangeLabel('Date Range');
    }
    
    closeModalAnimation();
    setTimeout(() => setDateFilterModalVisible(false), 200);
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'walk':
        return (
          <View style={[styles.activityIcon, { backgroundColor: '#F3E8FF' }]}>
            <View>
              <FontAwesome5 name="walking" size={22} color="#8B5CF6" />
            </View>
          </View>
        );
      case 'pee':
        return (
          <View style={[styles.activityIcon, { backgroundColor: '#FEF3C7' }]}>
            <View>
              <FontAwesome5 name="tint" size={22} color="#FBBF24" />
            </View>
          </View>
        );
      case 'poop':
        return (
          <View style={[styles.activityIcon, { backgroundColor: '#FEF3C7' }]}>
            <View>
              <FontAwesome5 name="poop" size={22} color="#B45309" />
            </View>
          </View>
        );
      case 'feeding':
        return (
          <View style={[styles.activityIcon, { backgroundColor: '#DBEAFE' }]}>
            <View>
              <FontAwesome5 name="utensils" size={22} color="#3B82F6" />
            </View>
          </View>
        );
      case 'medication':
        return (
          <View style={[styles.activityIcon, { backgroundColor: '#DCFCE7' }]}>
            <View>
              <FontAwesome5 name="pills" size={22} color="#10B981" />
            </View>
          </View>
        );
      default:
        return (
          <View style={[styles.activityIcon, { backgroundColor: '#E0E7FF' }]}>
            <View>
              <FontAwesome5 name="paw" size={22} color="#6366F1" />
            </View>
          </View>
        );
    }
  };

  const getActivityTitle = (activityType) => {
    switch (activityType) {
      case 'walk':
        return 'Walk';
      case 'pee':
        return 'Pee Break';
      case 'poop':
        return 'Poop Break';
      case 'feeding':
        return 'Feeding';
      case 'medication':
        return 'Medication';
      default:
        return 'Activity';
    }
  };

  const renderActivityItem = ({ item }) => {
    const activityTitle = getActivityTitle(item.activity_type);
    
    return (
      <TouchableOpacity 
        style={styles.activityCard}
        onPress={() => {
          // Navigate to activity details if needed
          // navigation.navigate('ActivityDetails', { activityId: item.id });
        }}
      >
        {getActivityIcon(item.activity_type)}
        <View style={styles.activityDetails}>
          <Text style={styles.activityTitle}>{activityTitle}</Text>
          <Text style={styles.activityTime}>{formatDateTime(item.start_time)}</Text>
          
          {/* Display dog name from the joined dogs table */}
          <View style={styles.dogNameContainer}>
            <FontAwesome5 name="dog" size={12} color="#6B7280" style={styles.dogIcon} />
            <Text style={styles.dogName}>{item.dog_name || 'Unknown Dog'}</Text>
          </View>
          
          {item.activity_type === 'walk' && item.distance_meters && (
            <View style={styles.walkStats}>
              <View style={styles.statItem}>
                <FontAwesome5 name="route" size={14} color="#6B7280" style={styles.statIcon} />
                <Text style={styles.statText}>
                  {(item.distance_meters / 1000).toFixed(2)} km
                </Text>
              </View>
              {item.duration_minutes && (
                <View style={styles.statItem}>
                  <FontAwesome5 name="clock" size={14} color="#6B7280" style={styles.statIcon} />
                  <Text style={styles.statText}>{item.duration_minutes} mins</Text>
                </View>
              )}
            </View>
          )}
          
          {item.notes && (
            <Text style={styles.notesText}>{item.notes}</Text>
          )}
        </View>
        <View>
          <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View>
        <FontAwesome5 name="paw" size={50} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyText}>No activities logged yet! 🐾</Text>
      <Text style={styles.emptySubtext}>Your pet's activities will appear here</Text>
      <TouchableOpacity 
        style={styles.addActivityButton}
        onPress={() => navigation.navigate('LogActivity', { activityType: 'Walk' })}
      >
        <Text style={styles.addActivityText}>Log Your First Activity</Text>
      </TouchableOpacity>
    </View>
  );

  // Filter buttons section
  const renderFiltersSection = () => (
    <View style={styles.filtersSection}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {/* Dog Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, selectedDog ? styles.dogFilterButton : null]}
          onPress={() => {
            openModalAnimation();
            setDogFilterModalVisible(true);
          }}
        >
          <View>
            <FontAwesome5 name="dog" size={14} color={selectedDog ? "white" : "#6B7280"} />
          </View>
          <Text style={selectedDog ? styles.dogFilterText : styles.filterText}>
            {selectedDogLabel} ▼
          </Text>
        </TouchableOpacity>
        
        {/* Activity Type Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, selectedActivityType ? styles.activeFilterButton : null]}
          onPress={() => {
            openModalAnimation();
            setActivityFilterModalVisible(true);
          }}
        >
          <View>
            <FontAwesome5 name="filter" size={14} color={selectedActivityType ? "white" : "#6B7280"} />
          </View>
          <Text style={selectedActivityType ? styles.activeFilterText : styles.filterText}>
            {selectedActivityTypeLabel} ▼
          </Text>
        </TouchableOpacity>
        
        {/* Date Range Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, selectedDateRange ? styles.activeFilterButton : null]}
          onPress={() => {
            openModalAnimation();
            setDateFilterModalVisible(true);
          }}
        >
          <View>
            <FontAwesome5 name="calendar-alt" size={14} color={selectedDateRange ? "white" : "#6B7280"} />
          </View>
          <Text style={selectedDateRange ? styles.activeFilterText : styles.filterText}>
            {selectedDateRangeLabel} ▼
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Log</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('LogActivity', { activityType: 'Walk' })}
        >
          <View>
            <FontAwesome5 name="plus" size={14} color="white" style={styles.addButtonIcon} />
          </View>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {renderFiltersSection()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredActivities || []}
          keyExtractor={(item) => (item && item.id ? item.id.toString() : Math.random().toString())}
          renderItem={renderActivityItem}
          ListEmptyComponent={renderEmptyList}
          ListFooterComponent={() => (
            <View style={{ height: 80 }} />
          )}
          contentContainerStyle={(!filteredActivities || filteredActivities.length === 0) ? { flex: 1 } : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8B5CF6']}
              tintColor="#8B5CF6"
            />
          }
        />
      )}

      {/* Dog Filter Modal - Now with real data from Supabase */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={dogFilterModalVisible}
        onRequestClose={() => {
          closeModalAnimation();
          setTimeout(() => setDogFilterModalVisible(false), 200);
        }}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="light" />
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'flex-end' }}
            activeOpacity={1} 
            onPress={() => {
              closeModalAnimation();
              setTimeout(() => setDogFilterModalVisible(false), 200);
            }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select a Dog</Text>
              
              {/* "All Dogs" option */}
              <TouchableOpacity 
                style={styles.modalItem} 
                onPress={() => applyDogFilter('All Dogs')}
              >
                <Text>All Dogs</Text>
              </TouchableOpacity>
              
              {/* Show loading spinner when dogs are being loaded */}
              {dogsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={styles.loadingText}>Loading dogs...</Text>
                </View>
              ) : dogs.length === 0 ? (
                // Show message when no dogs are found
                <Text style={styles.noResultsText}>No dogs found.</Text>
              ) : (
                // Map through dogs data to render each dog option
                <>
                  {dogs.map(dog => (
                    <TouchableOpacity 
                      key={dog.id.toString()} 
                      style={styles.modalItem} 
                      onPress={() => applyDogFilter(dog.name)}
                    >
                      <Text style={styles.modalItemText}>{dog.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* Activity Type Filter Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={activityFilterModalVisible}
        onRequestClose={() => {
          closeModalAnimation();
          setTimeout(() => setActivityFilterModalVisible(false), 200);
        }}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="light" />
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'flex-end' }}
            activeOpacity={1} 
            onPress={() => {
              closeModalAnimation();
              setTimeout(() => setActivityFilterModalVisible(false), 200);
            }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Activity Type</Text>
              <>
                {activityFilters.map(filter => (
                  <TouchableOpacity 
                    key={filter.id.toString()} 
                    style={styles.modalItem} 
                    onPress={() => applyActivityTypeFilter(filter.id, filter.label)}
                  >
                    <Text>{filter.label}</Text>
                  </TouchableOpacity>
                ))}
              </>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* Date Range Filter Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={dateFilterModalVisible}
        onRequestClose={() => {
          closeModalAnimation();
          setTimeout(() => setDateFilterModalVisible(false), 200);
        }}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="light" />
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'flex-end' }}
            activeOpacity={1} 
            onPress={() => {
              closeModalAnimation();
              setTimeout(() => setDateFilterModalVisible(false), 200);
            }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity style={styles.modalItem} onPress={() => applyDateRangeFilter('Today')}>
                <Text>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalItem} onPress={() => applyDateRangeFilter('This Week')}>
                <Text>This Week</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalItem} onPress={() => applyDateRangeFilter('This Month')}>
                <Text>This Month</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalItem} 
                onPress={() => {
                  setSelectedDateRange(null);
                  setSelectedDateRangeLabel('Date Range');
                  closeModalAnimation();
                  setTimeout(() => setDateFilterModalVisible(false), 200);
                }}
              >
                <Text>Clear Filter</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
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
    paddingVertical: 12,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonIcon: {
    marginRight: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  refreshButton: {
    padding: 8,
  },
  filtersSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  dogFilterButton: {
    backgroundColor: '#8B5CF6',
  },
  activeFilterButton: {
    backgroundColor: '#8B5CF6',
  },
  dogFilterText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  filterText: {
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  walkStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  noResultsText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  addActivityButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addActivityText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dogNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dogIcon: {
    marginRight: 4,
  },
  dogName: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default ActivitiesScreen; 