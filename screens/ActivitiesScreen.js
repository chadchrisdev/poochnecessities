import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  SectionList,
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Easing,
  Image,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { format, subDays, parseISO, isToday } from 'date-fns';
import { BlurView } from 'expo-blur';
import { getActivityIcon, getActivityTitle } from '../constants/activityIcons';
import ActivityIcon from '../src/components/ActivityIcon';
import { navigateToActivityDetail } from '../src/utils/activityNavigationHelper';

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
      
      // Start with the base query with proper join using dog_id foreign key
      let query = supabase
        .from('activities')
        .select(`
          id,
          activity_type,
          start_time,
          end_time,
          distance_meters,
          duration_minutes,
          notes,
          dog_id,
          dogs (
            id,
            name,
            photo_url
          )
        `)
        .order('start_time', { ascending: false });
      
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
          .gte('start_time', selectedDateRange.startDate.toISOString())
          .lte('start_time', selectedDateRange.endDate.toISOString());
      }
      
      // Execute the query
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        Alert.alert('Error', 'Unable to load activity history');
        return;
      }

      setActivities(data || []);
      setFilteredActivities(data || []);
    } catch (error) {
      console.error('Unexpected error fetching activities:', error);
      Alert.alert('Error', 'Something went wrong while loading activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch activities when component mounts
  useEffect(() => {
    fetchActivities();
  }, []);

  // Refresh activities when filters change
  useEffect(() => {
    fetchActivities();
  }, [selectedDog, selectedActivityType, selectedDateRange]);

  // Group activities by date for display
  const groupActivitiesByDate = (activities) => {
    if (!activities || activities.length === 0) return [];
    
    // Create a map of date strings to activities
    const groupedMap = {};
    
    activities.forEach(activity => {
      if (!activity.start_time) return;
      
      const dateStr = format(parseISO(activity.start_time), 'yyyy-MM-dd');
      if (!groupedMap[dateStr]) {
        groupedMap[dateStr] = {
          title: format(parseISO(activity.start_time), 'EEEE, MMMM d'),
          data: []
        };
      }
      
      groupedMap[dateStr].data.push(activity);
    });
    
    // Convert map to array and sort by date (newest first)
    return Object.values(groupedMap).sort((a, b) => {
      const dateA = new Date(a.data[0].start_time);
      const dateB = new Date(b.data[0].start_time);
      return dateB - dateA; // Descending order
    });
  };

  // Process activities when they change
  useEffect(() => {
    setFilteredActivities(activities || []);
  }, [activities]);

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

  const renderActivityIcon = (activityType) => {
    const { component: IconComponent, name, color, bgColor } = getActivityIcon(activityType);
    
    return (
      <View style={[styles.activityIconContainer, { backgroundColor: bgColor }]}>
        <IconComponent name={name} size={24} color={color} />
      </View>
    );
  };

  const renderActivityItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.activityCard}
        onPress={() => navigateToActivityDetail(navigation, item.id, item.activity_type)}
      >
        {renderActivityIcon(item.activity_type)}
        
        {/* Activity info column */}
        <View style={styles.activityDetails}>
          <Text style={styles.activityTitle}>
            {getActivityTitle(item.activity_type)}
          </Text>
          <Text style={styles.activityTime}>
            {format(parseISO(item.start_time), 'h:mm a')}
            {item.duration_minutes && ` • ${item.duration_minutes} mins`}
          </Text>
        </View>
        
        {/* Dog info column with name and avatar */}
        <View style={styles.dogActivityInfo}>
          <View style={styles.dogTextContainer}>
            <Text style={styles.activityDogName}>{item.dogs?.name || 'Unknown Dog'}</Text>
            {item.notes && item.notes.length > 0 && (
              <View style={styles.notesIndicator}>
                <FontAwesome5 name="sticky-note" size={12} color="#8B5CF6" />
              </View>
            )}
          </View>
          
          {/* Dog Avatar */}
          {item.dogs?.photo_url ? (
            <Image 
              source={{ uri: item.dogs.photo_url }} 
              style={styles.dogActivityAvatar} 
            />
          ) : (
            <View style={styles.dogActivityAvatarPlaceholder}>
              <FontAwesome5 name="dog" size={24} color="#8B5CF6" />
            </View>
          )}
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

  // Calculate activity stats for summary section based on current filters
  const calculateTodayStats = () => {
    // Return empty stats if no activities
    if (!filteredActivities || filteredActivities.length === 0) {
      return {
        peeCount: 0,
        poopCount: 0,
        walkCount: 0,
        totalDistance: 0
      };
    }
    
    // Filter activities that occurred today based on start_time
    const todayActivities = filteredActivities.filter(activity => {
      if (!activity.start_time) return false;
      return isToday(parseISO(activity.start_time));
    });
    
    // Initialize counters
    let peeCount = 0;
    let poopCount = 0;
    let walkCount = 0;
    let totalDistance = 0;
    
    // Calculate counts and total distance
    todayActivities.forEach(activity => {
      const activityType = activity.activity_type?.toLowerCase();
      
      if (activityType === 'pee') {
        peeCount++;
      } else if (activityType === 'poop') {
        poopCount++;
      } else if (activityType === 'walk') {
        walkCount++;
        
        // Add to total distance (convert from meters to km)
        if (activity.distance_meters) {
          totalDistance += parseFloat(activity.distance_meters) / 1000;
        } else if (activity.duration_minutes) {
          // Estimate distance based on 3.5 km/h walking speed if distance not available
          totalDistance += (parseFloat(activity.duration_minutes) / 60) * 3.5;
        }
      }
    });
    
    return {
      peeCount,
      poopCount,
      walkCount,
      totalDistance: parseFloat(totalDistance.toFixed(1)) // Round to 1 decimal place
    };
  };
  
  // Render the daily summary stats section
  const renderSummaryStats = () => {
    const stats = calculateTodayStats();
    
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Today's Activity</Text>
        <View style={styles.statsRowContainer}>
          {/* Pee Count */}
          <View style={styles.statCompactCard}>
            <View style={[styles.statCompactIconContainer, { backgroundColor: '#FBBF2420' }]}>
              <FontAwesome5 name="tint" size={16} color="#FBBF24" />
            </View>
            <Text style={styles.statCompactCount}>{stats.peeCount}</Text>
            <Text style={styles.statCompactLabel}>Pee</Text>
          </View>
          
          {/* Poop Count */}
          <View style={styles.statCompactCard}>
            <View style={[styles.statCompactIconContainer, { backgroundColor: '#92400E20' }]}>
              <FontAwesome5 name="poop" size={16} color="#92400E" />
            </View>
            <Text style={styles.statCompactCount}>{stats.poopCount}</Text>
            <Text style={styles.statCompactLabel}>Poop</Text>
          </View>
          
          {/* Walk Count */}
          <View style={styles.statCompactCard}>
            <View style={[styles.statCompactIconContainer, { backgroundColor: '#3B82F620' }]}>
              <FontAwesome5 name="walking" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.statCompactCount}>{stats.walkCount}</Text>
            <Text style={styles.statCompactLabel}>Walks</Text>
          </View>
          
          {/* Distance */}
          <View style={styles.statCompactCard}>
            <View style={[styles.statCompactIconContainer, { backgroundColor: '#3B82F620' }]}>
              <FontAwesome5 name="map-marked-alt" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.statCompactCount}>{stats.totalDistance}</Text>
            <Text style={styles.statCompactLabel}>Km</Text>
          </View>
        </View>
      </View>
    );
  };

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

      {renderSummaryStats()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : (
        <SectionList
          sections={groupActivitiesByDate(filteredActivities)}
          keyExtractor={(item) => (item && item.id ? item.id.toString() : Math.random().toString())}
          renderItem={renderActivityItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.dateHeaderContainer}>
              <Text style={styles.dateHeaderText}>{title}</Text>
              <View style={styles.dateHeaderLine} />
            </View>
          )}
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
          stickySectionHeadersEnabled={false}
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
    paddingTop: 8,
    paddingHorizontal: 16,
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
  activityCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIconContainer: {
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
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  notes: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  chevronContainer: {
    marginLeft: 'auto',
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
  walkStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dogAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
  },
  dogActivityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 12,
  },
  dogTextContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginRight: 8,
  },
  activityDogName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
    marginBottom: 4,
  },
  notesIndicator: {
    marginLeft: 4,
    marginTop: 2,
  },
  dogActivityAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8FF',
  },
  dogActivityAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateHeaderContainer: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 4,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  dateHeaderLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  summaryContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 10,
  },
  statsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statCompactCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 8,
    width: '23%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCompactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statCompactCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statCompactLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default ActivitiesScreen; 