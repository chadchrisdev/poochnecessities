import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, parseISO, differenceInMonths, differenceInYears, subDays, startOfDay, endOfDay, isToday } from 'date-fns';
import { supabase } from '../src/lib/supabase';
import { LineChart, BarChart } from 'react-native-chart-kit';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// Conversion constants
const LBS_TO_KG = 0.45359237;
const KG_TO_LBS = 2.20462262;
// Constants for distance calculation
const AVG_WALKING_SPEED_KM_PER_HOUR = 3.5;  // Average dog walking speed

const DogDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { dog } = route.params;
  
  // Weight tracking states
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 6m, all
  const [unitSystem, setUnitSystem] = useState('kg'); // 'kg' or 'lbs'
  
  // Weight entry modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Date picker states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [dateForDisplay, setDateForDisplay] = useState(format(new Date(), 'MMM d, yyyy'));

  // Activity comparison chart state
  const [activityData, setActivityData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Distance walked chart states
  const [walkDistanceData, setWalkDistanceData] = useState([]);
  const [walkDistanceLoading, setWalkDistanceLoading] = useState(true);
  const [walkDistanceChartData, setWalkDistanceChartData] = useState(null);

  // Walk duration chart states
  const [walkDurationData, setWalkDurationData] = useState([]);
  const [walkDurationLoading, setWalkDurationLoading] = useState(true);
  const [walkDurationChartData, setWalkDurationChartData] = useState(null);

  // Unit conversion helpers
  const convertKgToLbs = (kg) => {
    return (parseFloat(kg) * KG_TO_LBS).toFixed(1);
  };

  const convertLbsToKg = (lbs) => {
    return (parseFloat(lbs) * LBS_TO_KG).toFixed(1);
  };

  // Calculate dog's age in years and months
  const calculateDogAge = (birthday) => {
    if (!birthday) return 'Unknown age';
    
    try {
      // Parse the birthday string (expected format: YYYY-MM-DD)
      const parts = birthday.split('-');
      if (parts.length !== 3) return 'Unknown age';
      
      // Create date at noon to avoid timezone issues
      const birthDate = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
        12, 0, 0
      );
      
      const today = new Date();
      
      // Calculate years and months
      const years = differenceInYears(today, birthDate);
      const months = differenceInMonths(today, birthDate) % 12;
      
      // Format the age string
      if (years === 0) {
        if (months === 0) return 'Less than 1 month';
        return `${months} month${months !== 1 ? 's' : ''}`;
      } else if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.error('Error calculating dog age:', error);
      return 'Unknown age';
    }
  };

  // Handle unit system change
  const toggleUnitSystem = (newUnitSystem) => {
    if (newUnitSystem === unitSystem) return;
    setUnitSystem(newUnitSystem);
    
    // Update chart data
    if (weights.length > 0) {
      prepareChartData(weights);
    }
  };

  // Show date picker
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  // Hide date picker
  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  // Handle date selection
  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    setDateForDisplay(format(date, 'MMM d, yyyy'));
    hideDatePicker();
  };

  // Fetch weights from Supabase
  const fetchWeights = async () => {
    if (!dog.id) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('weights')
        .select('*')
        .eq('dog_id', dog.id)
        .order('recorded_at', { ascending: true });
      
      // Apply time filter
      if (timeRange === '1m') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        query = query.gte('recorded_at', oneMonthAgo.toISOString());
      } else if (timeRange === '6m') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        query = query.gte('recorded_at', sixMonthsAgo.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setWeights(data || []);
      prepareChartData(data || []);
    } catch (error) {
      console.error('Error fetching weight data:', error);
      Alert.alert('Error', 'Failed to load weight history');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data based on weights
  const prepareChartData = (data) => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }
    
    const labels = data.map(item => format(parseISO(item.recorded_at), 'MM/dd'));
    let dataPoints;
    
    if (unitSystem === 'kg') {
      dataPoints = data.map(item => parseFloat(parseFloat(item.weight).toFixed(1)));
    } else {
      dataPoints = data.map(item => parseFloat(parseFloat(convertKgToLbs(item.weight)).toFixed(1)));
    }
    
    // Always add a zero data point to ensure chart starts at 0
    // This ensures the fromZero prop works as expected
    const maxValue = Math.max(...dataPoints);
    if (maxValue < 1) {
      // For very small weights (like puppy weights), use a different approach
      dataPoints.push(0); // Hidden zero point 
      labels.push('');    // Empty label for the hidden point
    }
    
    setChartData({
      labels,
      datasets: [
        {
          data: dataPoints,
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Purple color
          strokeWidth: 2
        }
      ],
      legend: [`Weight (${unitSystem})`]
    });
  };

  // Add new weight entry
  const addWeight = async () => {
    if (!weightInput || isNaN(parseFloat(weightInput))) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Convert to kg for storage if in lbs
      let weightInKg = parseFloat(weightInput);
      if (unitSystem === 'lbs') {
        weightInKg = parseFloat(convertLbsToKg(weightInput));
      }
      
      const { data, error } = await supabase
        .from('weights')
        .insert([
          { 
            dog_id: dog.id,
            weight: weightInKg,
            note: noteInput.trim() || null,
            recorded_at: selectedDate.toISOString()
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Clear form, close modal and refresh data
      setWeightInput('');
      setNoteInput('');
      setSelectedDate(new Date());
      setDateForDisplay(format(new Date(), 'MMM d, yyyy'));
      setModalVisible(false);
      fetchWeights();
      
      Alert.alert('Success', 'Weight entry added successfully');
    } catch (error) {
      console.error('Error adding weight entry:', error);
      Alert.alert('Error', 'Failed to add weight entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Get display weight for history items
  const getDisplayWeight = (weightKg) => {
    if (unitSystem === 'kg') {
      return `${weightKg} kg`;
    } else {
      return `${convertKgToLbs(weightKg)} lbs`;
    }
  };

  // Safely get image URI, handling potential issues with URLs
  const getImageSource = () => {
    if (!dog.photo_url) return null;
    
    // Check if it's a valid URL or a local file path
    if (dog.photo_url.startsWith('file://') || dog.photo_url.startsWith('/') || dog.photo_url.startsWith('content://')) {
      return { uri: dog.photo_url };
    }
    
    return { uri: dog.photo_url };
  };

  // Fetch activity counts from the last 7 days
  const fetchActivityCounts = async (dogId) => {
    if (!dogId) return;
    
    try {
      setActivityLoading(true);
      
      // Calculate date from 7 days ago
      const today = new Date();
      const sevenDaysAgo = subDays(today, 7);
      
      // Fetch all activities from the last 7 days
      const { data, error } = await supabase
        .from('activities')
        .select('activity_type, start_time')
        .eq('dog_id', dogId)
        .gte('start_time', sevenDaysAgo.toISOString());
      
      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }
      
      // Initialize activity counts and day counter
      const activityCounts = {};
      let dayCount = 0;
      const dayTracker = {};
      
      // Process the activities and count by type, excluding today
      if (data && data.length > 0) {
        data.forEach(activity => {
          // Skip if no start_time
          if (!activity.start_time) return;
          
          const activityDate = parseISO(activity.start_time);
          
          // Skip activities from today
          if (isToday(activityDate)) return;
          
          // Track unique days for calculating the average
          const dateKey = format(activityDate, 'yyyy-MM-dd');
          if (!dayTracker[dateKey]) {
            dayTracker[dateKey] = true;
            dayCount++;
          }
          
          const type = activity.activity_type;
          if (type) {
            if (!activityCounts[type]) {
              activityCounts[type] = 0;
            }
            activityCounts[type] += 1;
          }
        });
        
        // Use at least 1 day to avoid division by zero
        dayCount = Math.max(1, dayCount);
        
        // Convert to the format needed and calculate daily averages
        const formattedData = Object.keys(activityCounts).map(type => ({
          activity_type: formatActivityType(type),
          count: activityCounts[type],
          dailyAverage: parseFloat((activityCounts[type] / dayCount).toFixed(1))
        }));
        
        setActivityData(formattedData);
      } else {
        setActivityData([]);
      }
    } catch (error) {
      console.error('Unexpected error fetching activity counts:', error);
      setActivityData([]);
    } finally {
      setActivityLoading(false);
    }
  };
  
  // Format activity type for display (capitalize, shorten names)
  const formatActivityType = (type) => {
    if (!type) return 'Other';
    
    const activityMap = {
      'walk': 'Walk',
      'pee': 'Pee',
      'poop': 'Poop',
      'feeding': 'Feed',
      'play': 'Play',
      'medication': 'Meds'
    };
    
    return activityMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Get color for each activity type
  const getActivityColor = (type) => {
    const colorMap = {
      'Walk': '#8B5CF6', // Purple
      'Pee': '#FBBF24',  // Yellow
      'Poop': '#92400E', // Brown
      'Feed': '#F87171', // Red
      'Play': '#10B981', // Green
      'Meds': '#3B82F6'  // Blue
    };
    
    return colorMap[type] || '#6B7280'; // Default gray
  };
  
  // Get icon name for activity type
  const getActivityIconName = (type) => {
    const iconMap = {
      'Walk': 'walking',
      'Pee': 'tint',
      'Poop': 'poop',
      'Feed': 'bone',
      'Play': 'baseball-ball',
      'Meds': 'pills',
      'Water': 'tint',
      'Grooming': 'cut',
      'Vet': 'stethoscope',
      'Training': 'graduation-cap'
    };
    
    return iconMap[type] || 'paw';
  };

  // Fetch walk distances from the past 7 days and group by day
  const fetchWalkDistances = async (dogId) => {
    if (!dogId) return;
    
    try {
      setWalkDistanceLoading(true);
      
      // Calculate date from 7 days ago
      const today = new Date();
      const sevenDaysAgo = subDays(today, 7);
      
      // Fetch all walk activities from the last 7 days
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('dog_id', dogId)
        .eq('activity_type', 'walk')
        .gte('start_time', sevenDaysAgo.toISOString())
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching walk data:', error);
        setWalkDistanceLoading(false);
        return;
      }
      
      // Process walks and group by day
      const walksByDay = {};
      
      // Initialize all 7 days with zero values
      for (let i = 0; i < 7; i++) {
        const date = subDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        walksByDay[dateKey] = {
          date: date,
          distance: 0,
          count: 0,
          totalDuration: 0
        };
      }
      
      // Process each walk
      if (data && data.length > 0) {
        data.forEach(walk => {
          if (!walk.start_time) return;
          
          const walkDate = parseISO(walk.start_time);
          const dateKey = format(walkDate, 'yyyy-MM-dd');
          
          // Skip if outside our 7-day window
          if (!walksByDay[dateKey]) return;
          
          // Calculate distance based on available data
          let distance = 0;
          
          if (walk.distance) {
            // If distance is directly recorded
            distance = parseFloat(walk.distance);
          } else if (walk.duration_minutes) {
            // Estimate distance based on duration and average speed
            distance = (walk.duration_minutes / 60) * AVG_WALKING_SPEED_KM_PER_HOUR;
          }
          
          // Update the day's data
          walksByDay[dateKey].distance += distance;
          walksByDay[dateKey].count += 1;
          walksByDay[dateKey].totalDuration += walk.duration_minutes || 0;
        });
      }
      
      // Convert to array and sort by date (oldest to newest)
      const walkDistanceArray = Object.values(walksByDay).sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      setWalkDistanceData(walkDistanceArray);
      prepareWalkDistanceChartData(walkDistanceArray);
    } catch (error) {
      console.error('Unexpected error fetching walk data:', error);
      setWalkDistanceData([]);
      setWalkDistanceChartData(null);
    } finally {
      setWalkDistanceLoading(false);
    }
  };
  
  // Prepare chart data for walk distances
  const prepareWalkDistanceChartData = (data) => {
    if (!data || data.length === 0) {
      setWalkDistanceChartData(null);
      return;
    }
    
    // Create labels using short day names (Mon, Tue, etc.)
    const labels = data.map(item => format(item.date, 'EEE'));
    
    // Create distance data points (rounded to 1 decimal)
    const distances = data.map(item => 
      parseFloat(item.distance.toFixed(1))
    );
    
    setWalkDistanceChartData({
      labels,
      datasets: [
        {
          data: distances,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue color
          strokeWidth: 2
        }
      ],
      legend: ['Distance (km)']
    });
  };

  // Fetch walk durations from the past 7 days and group by day
  const fetchWalkDurations = async (dogId) => {
    if (!dogId) return;
    
    try {
      setWalkDurationLoading(true);
      
      // Calculate date from 7 days ago
      const today = new Date();
      const sevenDaysAgo = subDays(today, 7);
      
      // Fetch all walk activities from the last 7 days
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('dog_id', dogId)
        .eq('activity_type', 'walk')
        .gte('start_time', sevenDaysAgo.toISOString())
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching walk duration data:', error);
        setWalkDurationLoading(false);
        return;
      }
      
      // Process walks and group by day
      const walksByDay = {};
      
      // Initialize all 7 days with zero values
      for (let i = 0; i < 7; i++) {
        const date = subDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        walksByDay[dateKey] = {
          date: date,
          duration: 0,
          count: 0
        };
      }
      
      // Process each walk
      if (data && data.length > 0) {
        data.forEach(walk => {
          if (!walk.start_time) return;
          
          const walkDate = parseISO(walk.start_time);
          const dateKey = format(walkDate, 'yyyy-MM-dd');
          
          // Skip if outside our 7-day window
          if (!walksByDay[dateKey]) return;
          
          // Calculate duration based on available data
          let duration = 0;
          
          if (walk.duration_minutes) {
            // If duration is directly recorded
            duration = parseInt(walk.duration_minutes);
          } else if (walk.start_time && walk.end_time) {
            // Calculate duration from start and end times
            const startTime = parseISO(walk.start_time);
            const endTime = parseISO(walk.end_time);
            const durationMs = endTime.getTime() - startTime.getTime();
            duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
          }
          
          // Update the day's data
          walksByDay[dateKey].duration += duration;
          walksByDay[dateKey].count += 1;
        });
      }
      
      // Convert to array and sort by date (oldest to newest)
      const walkDurationArray = Object.values(walksByDay).sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      setWalkDurationData(walkDurationArray);
      prepareWalkDurationChartData(walkDurationArray);
    } catch (error) {
      console.error('Unexpected error fetching walk duration data:', error);
      setWalkDurationData([]);
      setWalkDurationChartData(null);
    } finally {
      setWalkDurationLoading(false);
    }
  };
  
  // Prepare chart data for walk durations
  const prepareWalkDurationChartData = (data) => {
    if (!data || data.length === 0) {
      setWalkDurationChartData(null);
      return;
    }
    
    // Create labels using short day names (Mon, Tue, etc.)
    const labels = data.map(item => format(item.date, 'EEE'));
    
    // Create duration data points
    const durations = data.map(item => item.duration);
    
    setWalkDurationChartData({
      labels,
      datasets: [
        {
          data: durations,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green color
          strokeWidth: 2
        }
      ],
      legend: ['Duration (min)']
    });
  };

  // Fetch weights when component mounts or time range changes
  useEffect(() => {
    fetchWeights();
  }, [dog.id, timeRange]);

  // Fetch activity data when component mounts
  useEffect(() => {
    if (dog.id) {
      fetchActivityCounts(dog.id);
      fetchWalkDistances(dog.id);
      fetchWalkDurations(dog.id);
    }
  }, [dog.id]);

  // Update chart data when unit system changes
  useEffect(() => {
    if (weights.length > 0) {
      prepareChartData(weights);
    }
  }, [unitSystem]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dog.name}'s Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditDog', { dog })}
        >
          <FontAwesome5 name="edit" size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Dog Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {dog.photo_url ? (
              <Image 
                source={getImageSource()} 
                style={styles.profileImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <FontAwesome5 name="dog" size={40} color="#8B5CF6" />
              </View>
            )}
          </View>
          
          <View style={styles.dogInfo}>
            <Text style={styles.dogName}>{dog.name}</Text>
            <Text style={styles.dogBreed}>{dog.breed}</Text>
            <Text style={styles.dogAge}>{calculateDogAge(dog.birthday)}</Text>
          </View>
        </View>

        {/* Weight Tracking Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weight Tracking</Text>
            <TouchableOpacity 
              style={styles.addWeightButton}
              onPress={() => setModalVisible(true)}
            >
              <FontAwesome5 name="plus" size={12} color="white" />
              <Text style={styles.addWeightButtonText}>Add Weight</Text>
            </TouchableOpacity>
          </View>
          
          {/* Unit Selector */}
          <View style={styles.unitSelector}>
            <Text style={styles.unitSelectorLabel}>Unit:</Text>
            <View style={styles.unitToggleContainer}>
              <TouchableOpacity 
                style={[styles.unitToggleButton, unitSystem === 'kg' && styles.activeUnitButton]}
                onPress={() => toggleUnitSystem('kg')}
              >
                <Text style={[styles.unitToggleText, unitSystem === 'kg' && styles.activeUnitText]}>kg</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.unitToggleButton, unitSystem === 'lbs' && styles.activeUnitButton]}
                onPress={() => toggleUnitSystem('lbs')}
              >
                <Text style={[styles.unitToggleText, unitSystem === 'lbs' && styles.activeUnitText]}>lbs</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Time Range Selector */}
          <View style={styles.timeRangeSelector}>
            <TouchableOpacity 
              style={[styles.timeRangeButton, timeRange === '1m' && styles.activeTimeRange]}
              onPress={() => setTimeRange('1m')}
            >
              <Text style={[styles.timeRangeText, timeRange === '1m' && styles.activeTimeRangeText]}>1 Month</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.timeRangeButton, timeRange === '6m' && styles.activeTimeRange]}
              onPress={() => setTimeRange('6m')}
            >
              <Text style={[styles.timeRangeText, timeRange === '6m' && styles.activeTimeRangeText]}>6 Months</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.timeRangeButton, timeRange === 'all' && styles.activeTimeRange]}
              onPress={() => setTimeRange('all')}
            >
              <Text style={[styles.timeRangeText, timeRange === 'all' && styles.activeTimeRangeText]}>All Time</Text>
            </TouchableOpacity>
          </View>
          
          {/* Weight Chart */}
          <View style={styles.chartContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading weight data...</Text>
            </View>
          ) : !chartData ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No weight data available</Text>
              <Text style={styles.noDataSubtext}>Add your dog's weight to start tracking</Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - 32} // Use full container width
                height={220}
                fromZero
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: '#8B5CF6',
                  },
                  paddingRight: 10,
                  paddingTop: 20,
                  paddingBottom: 10,
                  paddingLeft: 40, // Add space for Y-axis labels
                }}
                bezier
                withInnerLines
                style={{
                  borderRadius: 8,
                  marginLeft: 0,
                }}
                segments={4}
                legend={[`Weight (${unitSystem})`]}
              />
            </View>
          )}
          </View>
          
          {/* Weight History List */}
          <Text style={styles.historyTitle}>Weight History</Text>
          {weights.length === 0 ? (
            <Text style={styles.noHistoryText}>No weight entries yet</Text>
          ) : (
            <View style={styles.historyList}>
              {weights.slice().reverse().map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Text style={styles.historyItemWeight}>{getDisplayWeight(item.weight)}</Text>
                    <Text style={styles.historyItemDate}>
                      {format(parseISO(item.recorded_at), 'MMM d, yyyy')}
                    </Text>
                  </View>
                  {item.note && (
                    <Text style={styles.historyItemNote}>{item.note}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Activity Summary with Daily Averages */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Activity Average</Text>
            <View style={styles.activityHeaderRight}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => fetchActivityCounts(dog.id)}
                disabled={activityLoading}
              >
                <FontAwesome5 
                  name="sync" 
                  size={14} 
                  color="#8B5CF6" 
                  style={activityLoading ? styles.spinningIcon : null} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {activityLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading activity data...</Text>
            </View>
          ) : activityData.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No activity data available</Text>
              <Text style={styles.noDataSubtext}>Record activities using the "+" button</Text>
            </View>
          ) : (
            <>
              <View style={styles.activityCounterContainer}>
                {activityData
                  .filter(item => item.activity_type !== 'Walk' && item.count > 0)
                  .map((activity) => (
                    <View key={activity.activity_type} style={styles.activityCounterItem}>
                      <View 
                        style={[
                          styles.activityIconBubble, 
                          { backgroundColor: getActivityColor(activity.activity_type) }
                        ]}
                      >
                        <FontAwesome5 
                          name={getActivityIconName(activity.activity_type)} 
                          size={20} 
                          color="white" 
                        />
                      </View>
                      <View style={styles.activityCounterTextContainer}>
                        <Text style={styles.activityCounterCount}>{activity.dailyAverage}</Text>
                        <Text style={styles.activityCounterType}>{activity.activity_type}/day</Text>
                      </View>
                    </View>
                  ))}
                  
                {activityData.filter(item => item.activity_type !== 'Walk' && item.count > 0).length === 0 && (
                  <View style={styles.noActivitiesContainer}>
                    <Text style={styles.noActivitiesText}>No activities other than walks recorded</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.timeframeFooter}>Last 7 days (excl. today)</Text>
            </>
          )}
        </View>

        {/* Distance Walked Per Day Chart */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Distance Walked Per Day</Text>
            <View style={styles.activityHeaderRight}>
              <Text style={styles.sectionSubtitle}>Last 7 days</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => fetchWalkDistances(dog.id)}
                disabled={walkDistanceLoading}
              >
                <FontAwesome5 
                  name="sync" 
                  size={14} 
                  color="#3B82F6" 
                  style={walkDistanceLoading ? styles.spinningIcon : null} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {walkDistanceLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading walk data...</Text>
            </View>
          ) : !walkDistanceChartData || walkDistanceData.every(day => day.distance === 0) ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No walks recorded in the past week</Text>
              <Text style={styles.noDataSubtext}>Log walks to see your distance stats</Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              <LineChart
                data={walkDistanceChartData}
                width={Dimensions.get('window').width - 32}
                height={220}
                yAxisSuffix=" km"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: '#3B82F6',
                  },
                  style: {
                    borderRadius: 16,
                  },
                  paddingRight: 10,
                  paddingTop: 20,
                  paddingBottom: 10,
                  paddingLeft: 40, // Add space for Y-axis labels
                }}
                bezier
                withInnerLines
                style={{
                  borderRadius: 8,
                  marginTop: 10,
                  marginBottom: 10,
                }}
                fromZero
                segments={4}
              />
              <View style={styles.walkStatsContainer}>
                <View style={styles.walkStatItem}>
                  <Text style={styles.walkStatValue}>
                    {walkDistanceData.reduce((sum, day) => sum + day.distance, 0).toFixed(1)} km
                  </Text>
                  <Text style={styles.walkStatLabel}>Total Distance</Text>
                </View>
                <View style={styles.walkStatItem}>
                  <Text style={styles.walkStatValue}>
                    {walkDistanceData.reduce((sum, day) => sum + day.count, 0)}
                  </Text>
                  <Text style={styles.walkStatLabel}>Total Walks</Text>
                </View>
                <View style={styles.walkStatItem}>
                  <Text style={styles.walkStatValue}>
                    {(walkDistanceData.reduce((sum, day) => sum + day.distance, 0) / 
                      Math.max(1, walkDistanceData.filter(day => day.distance > 0).length)).toFixed(1)} km
                  </Text>
                  <Text style={styles.walkStatLabel}>Avg Distance/Day</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Walk Duration Per Day Chart */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Walk Duration Per Day</Text>
            <View style={styles.activityHeaderRight}>
              <Text style={styles.sectionSubtitle}>Last 7 days</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => fetchWalkDurations(dog.id)}
                disabled={walkDurationLoading}
              >
                <FontAwesome5 
                  name="sync" 
                  size={14} 
                  color="#10B981" 
                  style={walkDurationLoading ? styles.spinningIcon : null} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {walkDurationLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading walk data...</Text>
            </View>
          ) : !walkDurationChartData || walkDurationData.every(day => day.duration === 0) ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No recent walks to show</Text>
              <Text style={styles.noDataSubtext}>Log walks to see your duration stats</Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              <BarChart
                data={walkDurationChartData}
                width={Dimensions.get('window').width - 32}
                height={220}
                yAxisSuffix=" min"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
                  barPercentage: 0.7,
                  propsForLabels: {
                    fontSize: 11,
                    fontWeight: '500',
                  },
                  style: {
                    borderRadius: 16,
                  },
                  paddingRight: 10,
                  paddingTop: 20,
                  paddingBottom: 10,
                  paddingLeft: 40, // Add space for Y-axis labels
                }}
                withInnerLines
                showValuesOnTopOfBars
                fromZero
                segments={4}
                style={{
                  borderRadius: 8,
                  marginTop: 10,
                  marginBottom: 10,
                }}
              />
              <View style={styles.walkStatsContainer}>
                <View style={styles.walkStatItem}>
                  <Text style={[styles.walkStatValue, { color: '#10B981' }]}>
                    {walkDurationData.reduce((sum, day) => sum + day.duration, 0)} min
                  </Text>
                  <Text style={styles.walkStatLabel}>Total Duration</Text>
                </View>
                <View style={styles.walkStatItem}>
                  <Text style={[styles.walkStatValue, { color: '#10B981' }]}>
                    {walkDurationData.reduce((sum, day) => sum + day.count, 0)}
                  </Text>
                  <Text style={styles.walkStatLabel}>Total Walks</Text>
                </View>
                <View style={styles.walkStatItem}>
                  <Text style={[styles.walkStatValue, { color: '#10B981' }]}>
                    {Math.round(walkDurationData.reduce((sum, day) => sum + day.duration, 0) / 
                      Math.max(1, walkDurationData.filter(day => day.count > 0).length))} min
                  </Text>
                  <Text style={styles.walkStatLabel}>Avg Duration/Day</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Weight Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Weight Entry</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <FontAwesome5 name="times" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Date Picker Button */}
            <Text style={styles.modalLabel}>Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={showDatePicker}
            >
              <FontAwesome5 name="calendar-alt" size={16} color="#6B7280" style={styles.dateIcon} />
              <Text style={styles.datePickerText}>{dateForDisplay}</Text>
            </TouchableOpacity>
            
            {/* Weight Input with Unit Selector */}
            <Text style={styles.modalLabel}>Weight</Text>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder={`Weight (${unitSystem})`}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.modalUnitSelector}>
                <TouchableOpacity 
                  style={[styles.modalUnitButton, unitSystem === 'kg' && styles.activeModalUnitButton]}
                  onPress={() => setUnitSystem('kg')}
                >
                  <Text style={[styles.modalUnitButtonText, unitSystem === 'kg' && styles.activeModalUnitButtonText]}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalUnitButton, unitSystem === 'lbs' && styles.activeModalUnitButton]}
                  onPress={() => setUnitSystem('lbs')}
                >
                  <Text style={[styles.modalUnitButtonText, unitSystem === 'lbs' && styles.activeModalUnitButtonText]}>lbs</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Note Input */}
            <Text style={styles.modalLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="Add a note..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            
            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, !weightInput && styles.submitButtonDisabled]}
              onPress={addWeight}
              disabled={!weightInput || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Save Weight</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={selectedDate}
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
      />
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
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  dogBreed: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  dogAge: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addWeightButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addWeightButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  unitSelectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginRight: 8,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeUnitButton: {
    backgroundColor: '#8B5CF6',
  },
  unitToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeUnitText: {
    color: 'white',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  activeTimeRange: {
    backgroundColor: '#8B5CF6',
  },
  timeRangeText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: 'white',
  },
  chartContainer: {
    marginBottom: 16,
    width: '100%',
    paddingHorizontal: 0,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 12,
  },
  historyList: {
    maxHeight: 300,
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyItemWeight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  historyItemDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyItemNote: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dateIcon: {
    marginRight: 8,
  },
  datePickerText: {
    color: '#1F2937',
    fontSize: 16,
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  weightInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1F2937',
  },
  modalUnitSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalUnitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeModalUnitButton: {
    backgroundColor: '#8B5CF6',
  },
  modalUnitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeModalUnitButtonText: {
    color: 'white',
  },
  noteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 60,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chartWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  activityHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  spinningIcon: {
    animation: 'spin 1s linear infinite',
  },
  activityCounterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  activityCounterItem: {
    width: '30%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    margin: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityCounterTextContainer: {
    alignItems: 'center',
  },
  activityCounterCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  activityCounterType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  timeframeFooter: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  noActivitiesContainer: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  noActivitiesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  walkStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  walkStatItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  walkStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  walkStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default DogDetailsScreen; 