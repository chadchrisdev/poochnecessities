import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { supabase } from '../src/lib/supabase';

const { width } = Dimensions.get('window');
const DEFAULT_LATITUDE = 37.78825;
const DEFAULT_LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.005; // Smaller delta for closer zoom
const LONGITUDE_DELTA = 0.005;

const AddWalkScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  
  // State variables for timer functionality
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isWalking, setIsWalking] = useState(false);
  
  // Target distance state (in meters)
  const [targetDistance, setTargetDistance] = useState(null);
  const [targetInputValue, setTargetInputValue] = useState('');
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [walkCompleted, setWalkCompleted] = useState(false);
  
  // State for notes
  const [notes, setNotes] = useState('');
  
  // State for time pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // GPS and Map state
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [walkPath, setWalkPath] = useState([]);
  const [distance, setDistance] = useState(0);
  const [pace, setPace] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add state for loading indicator
  const [isSaving, setIsSaving] = useState(false);
  
  // Add state for dog selection
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [dogsLoading, setDogsLoading] = useState(true);
  const [dogModalVisible, setDogModalVisible] = useState(false);
  
  // Calculate completion percentage whenever distance or target distance changes
  useEffect(() => {
    if (targetDistance && distance > 0) {
      const percentage = Math.min((distance / targetDistance) * 100, 100);
      setCompletionPercentage(percentage);
      
      if (!walkCompleted && distance >= targetDistance) {
        setWalkCompleted(true);
        // Optional: Show a congratulatory message
        Alert.alert(
          "Target Reached!",
          "Congratulations! You've reached your walk target distance.",
          [{ text: "Great!" }]
        );
      }
    }
  }, [distance, targetDistance]);
  
  // Request location permissions and set up initial location
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied",
          "Allow location access to track your walk path.",
          [{ text: "OK" }]
        );
        setIsLoading(false);
        return;
      }
      
      // Get initial location
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
        });
        
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        // Center map on initial location
        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        });
      } catch (err) {
        console.error("Error getting initial location:", err);
      }
      
      setIsLoading(false);
    })();
    
    // Clean up subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  
  // Start location tracking when walk starts
  useEffect(() => {
    if (isWalking && locationPermission === 'granted') {
      startLocationTracking();
    } else if (!isWalking && locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    // Clean up subscription when component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isWalking, locationPermission]);
  
  // Calculate duration whenever start or end time changes
  useEffect(() => {
    if (startTime && endTime) {
      // Calculate the duration in minutes
      const durationMs = endTime.getTime() - startTime.getTime();
      
      // Handle cases where end time is earlier than start time (next day)
      let durationMinutes = Math.round(durationMs / (1000 * 60));
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Add 24 hours in minutes
      }
      
      setDuration(durationMinutes);
      
      // Calculate pace (minutes per kilometer)
      if (distance > 0) {
        const distanceInKm = distance / 1000;
        const paceValue = durationMinutes / distanceInKm;
        setPace(paceValue);
      }
    } else {
      setDuration(null);
      setPace(null);
    }
  }, [startTime, endTime, distance]);
  
  // Start tracking user location
  const startLocationTracking = async () => {
    // Clear previous path if any
    setWalkPath([]);
    setDistance(0);
    
    // Start watching position
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,      // Update every 5 seconds
        distanceInterval: 5,     // or every 5 meters
      },
      (location) => {
        const newCoord = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        setCurrentLocation(newCoord);
        
        // Add to path and recalculate distance
        setWalkPath(prevPath => {
          const newPath = [...prevPath, newCoord];
          
          // Calculate new distance if we have at least 2 points
          if (newPath.length >= 2) {
            const lastPoint = prevPath[prevPath.length - 1];
            const newPoint = newCoord;
            
            const segmentDistance = getDistance(
              { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
              { latitude: newPoint.latitude, longitude: newPoint.longitude }
            );
            
            setDistance(prevDistance => prevDistance + segmentDistance);
          }
          
          return newPath;
        });
        
        // Center map on current location
        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        });
      }
    );
    
    setLocationSubscription(subscription);
  };
  
  // Format time to 12-hour format with AM/PM
  const formatTime = (time) => {
    if (!time) return 'Not Set';
    return format(time, 'h:mm a'); // e.g. "2:30 PM"
  };

  // Handle starting a walk
  const handleStartWalk = () => {
    if (selectedDogs.length === 0) {
      Alert.alert('Error', 'Please select at least one dog for this walk');
      return;
    }
    
    if (locationPermission !== 'granted') {
      Alert.alert(
        'Location Required', 
        'Location permission is needed to track your walk. Please enable location in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Set the start time to current time
    setStartTime(new Date());
    
    // Start walk mode
    setIsWalking(true);
    
    // Start tracking location
    startLocationTracking();
  };
  
  // Handle stopping a walk
  const handleStopWalk = () => {
    // Confirm with user before stopping the walk
    Alert.alert(
      "Stop Walk",
      "Are you sure you want to stop this walk?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Stop Walk",
          onPress: () => {
            const now = new Date();
            setEndTime(now);
            setIsWalking(false);
          }
        }
      ]
    );
  };

  // Handle time change for the DateTimePicker
  const onTimeChange = (event, selectedTime, timeType) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
    
    if (selectedTime) {
      if (timeType === 'start') {
        setStartTime(selectedTime);
      } else {
        setEndTime(selectedTime);
      }
    }
  };
  
  // Format distance for display
  const formatDistance = () => {
    if (distance < 1000) {
      return `${distance.toFixed(0)} m`;
    } else {
      return `${(distance / 1000).toFixed(2)} km`;
    }
  };
  
  // Format pace for display
  const formatPace = () => {
    if (!pace) return 'N/A';
    
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  // Handle target distance input
  const handleSetTargetDistance = () => {
    if (targetInputValue.trim() === '') {
      setTargetDistance(null);
      setShowTargetInput(false);
      return;
    }
    
    const distanceInKm = parseFloat(targetInputValue);
    if (!isNaN(distanceInKm) && distanceInKm > 0) {
      // Convert km to meters for internal calculations
      setTargetDistance(distanceInKm * 1000);
      setShowTargetInput(false);
    } else {
      Alert.alert(
        "Invalid Distance",
        "Please enter a valid positive number.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Format target distance for display
  const formatTargetDistance = () => {
    if (!targetDistance) return null;
    return `${(targetDistance / 1000).toFixed(1)} km`;
  };

  // Fetch dogs from Supabase
  const fetchDogs = async () => {
    try {
      setDogsLoading(true);
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, photo_url')
        .order('name');

      if (error) {
        console.error('Error fetching dogs:', error);
        Alert.alert('Error', 'Unable to load dogs');
        return;
      }

      setDogs(data || []);
      
      // If there's only one dog, auto-select it
      if (data && data.length === 1) {
        setSelectedDog(data[0]);
        setSelectedDogs([data[0]]);
      } else if (data && data.length > 0) {
        // By default, select all dogs when multiple are available
        setSelectedDogs([...data]);
      }
    } catch (error) {
      console.error('Unexpected error fetching dogs:', error);
      Alert.alert('Error', 'Something went wrong while loading dogs');
    } finally {
      setDogsLoading(false);
    }
  };

  // Fetch dogs when component mounts
  useEffect(() => {
    fetchDogs();
  }, []);

  // Modified save function to include selected dogs
  const handleSaveWalk = async () => {
    if (selectedDogs.length === 0) {
      Alert.alert('Error', 'Please select at least one dog for this walk');
      return;
    }

    try {
      // Show loading indicator
      setIsSaving(true);
      
      // Base activity data without dog-specific fields
      const baseActivityData = {
        activity_type: 'walk',
        start_time: startTime.toISOString(),
        end_time: endTime ? endTime.toISOString() : null,
        duration_minutes: duration, 
        distance_meters: distance, 
        notes: notes,
      };
      
      // Create one activity per selected dog
      const activityPromises = selectedDogs.map(dog => {
        const dogActivityData = {
          ...baseActivityData,
          dog_id: dog.id,
        };
        
        return supabase
          .from('activities')
          .insert([dogActivityData]);
      });
      
      // Execute all insertions in parallel
      const results = await Promise.all(activityPromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error('Errors saving walk:', errors);
        Alert.alert('Error', 'There was a problem saving your walk for some dogs.');
      } else {
        console.log('Walk saved to activities for all selected dogs');
        Alert.alert('Success', 'Walk saved successfully!', [
          { text: "OK", onPress: () => navigation.navigate('Main') }
        ]);
      }
    } catch (e) {
      console.error('Unexpected error saving walk:', e.message);
      Alert.alert('Error', 'Unexpected error saving walk.');
    } finally {
      // Hide loading indicator
      setIsSaving(false);
    }
  };

  // Calculate map height based on scroll position - simple interpolation 
  const mapHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [250, 100],
    extrapolate: 'clamp' // clamp so it doesn't go below or above
  });
  
  // Calculate map border and shadow properties based on scroll
  const mapBorderRadius = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [12, 20],
    extrapolate: 'clamp'
  });
  
  const mapShadowOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0.1, 0.3],
    extrapolate: 'clamp'
  });

  const mapScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });

  // Calculate opacity for the expand indicator
  const expandIndicatorOpacity = scrollY.interpolate({
    inputRange: [50, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  // Function to expand the map when collapsed map is pressed
  const handleMapPress = () => {
    // Simple condition without accessing _value directly
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Walk</Text>
        <View style={{ width: 20 }} />
      </View>
      
      <Animated.ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        decelerationRate="normal"
      >
        {/* Map View - Now in an Animated.View with dynamic height */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={handleMapPress}
        >
          <Animated.View 
            style={[
              styles.mapContainer, 
              { 
                height: mapHeight,
                borderRadius: mapBorderRadius,
                shadowOpacity: mapShadowOpacity,
                transform: [{ scale: mapScale }]
              }
            ]}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Getting your location...</Text>
              </View>
            ) : locationPermission !== 'granted' ? (
              <View style={styles.permissionError}>
                <FontAwesome5 name="exclamation-triangle" size={32} color="#EF4444" />
                <Text style={styles.permissionErrorText}>
                  Location permission is required to track your walk.
                </Text>
              </View>
            ) : (
              <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  showsUserLocation
                  followsUserLocation
                  zoomControlEnabled
                  showsMyLocationButton={true}
                  initialRegion={{
                    latitude: currentLocation?.latitude || DEFAULT_LATITUDE,
                    longitude: currentLocation?.longitude || DEFAULT_LONGITUDE,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                  }}
                >
                  {walkPath.length > 1 && (
                    <Polyline
                      coordinates={walkPath}
                      strokeColor="#8B5CF6"
                      strokeWidth={4}
                    />
                  )}
                </MapView>
                
                {/* Expand indicator that appears when map is collapsed */}
                <Animated.View 
                  style={[
                    styles.expandIndicator,
                    { opacity: expandIndicatorOpacity }
                  ]}
                >
                  <FontAwesome5 name="expand" size={16} color="white" />
                </Animated.View>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Target Distance Setting (only shown before starting) */}
        {!isWalking && !endTime && (
          <View style={styles.targetDistanceSection}>
            {showTargetInput ? (
              <View style={styles.targetInputContainer}>
                <TextInput
                  style={styles.targetInput}
                  placeholder="Enter distance in km (e.g., 2.5)"
                  keyboardType="numeric"
                  value={targetInputValue}
                  onChangeText={setTargetInputValue}
                />
                <View style={styles.targetButtons}>
                  <TouchableOpacity 
                    style={[styles.targetButton, styles.cancelButton]}
                    onPress={() => setShowTargetInput(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.targetButton, styles.setButton]}
                    onPress={handleSetTargetDistance}
                  >
                    <Text style={styles.setButtonText}>Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.setTargetButton}
                onPress={() => setShowTargetInput(true)}
              >
                <FontAwesome5 name="bullseye" size={16} color="white" style={styles.buttonIcon} />
                <Text style={styles.setTargetButtonText}>
                  {targetDistance ? `Change Target (${formatTargetDistance()})` : 'Set Target Distance'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Dog Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dog Selection</Text>
          
          {dogsLoading ? (
            <View style={styles.loadingDogs}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading dogs...</Text>
            </View>
          ) : dogs.length === 0 ? (
            <View style={styles.noDogs}>
              <Text style={styles.noDogsText}>No dogs found</Text>
              <TouchableOpacity 
                style={styles.addDogButton}
                onPress={() => navigation.navigate('AddDog')}
              >
                <Text style={styles.addDogButtonText}>Add a Dog</Text>
              </TouchableOpacity>
            </View>
          ) : dogs.length === 1 ? (
            <View style={styles.singleDogContainer}>
              <View style={styles.dogAvatarContainer}>
                {dogs[0].photo_url ? (
                  <Image 
                    source={{ uri: dogs[0].photo_url }} 
                    style={styles.dogAvatar} 
                  />
                ) : (
                  <View style={styles.dogAvatarPlaceholder}>
                    <FontAwesome5 name="dog" size={24} color="#8B5CF6" />
                  </View>
                )}
              </View>
              <Text style={styles.walkingDogText}>Walking {dogs[0].name}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.selectDogsButton}
              onPress={() => setDogModalVisible(true)}
            >
              <FontAwesome5 name="paw" size={18} color="#8B5CF6" style={styles.buttonIcon} />
              <Text style={styles.selectDogsText}>
                {selectedDogs.length === dogs.length 
                  ? 'All Dogs Selected' 
                  : `${selectedDogs.length} ${selectedDogs.length === 1 ? 'Dog' : 'Dogs'} Selected`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Walk Controls */}
        <View style={styles.walkControlsContainer}>
          {/* Start and Stop buttons in row */}
          <View style={styles.walkButtonsRow}>
            <TouchableOpacity 
              style={[
                styles.walkButton,
                styles.startButton, 
                startTime ? styles.disabledButton : { backgroundColor: '#10B981' } // Green when not started, grey when started
              ]}
              onPress={handleStartWalk}
              disabled={startTime !== null}
            >
              <FontAwesome5 name="play" size={16} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Start Walk</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.walkButton,
                styles.stopButton, 
                (!startTime || endTime) ? styles.disabledButton : { backgroundColor: '#EF4444' } // Red when walk in progress, grey otherwise
              ]}
              onPress={handleStopWalk}
              disabled={!startTime || endTime !== null}
            >
              <FontAwesome5 name="stop" size={16} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Stop Walk</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Walk Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>
              {duration !== null ? `${duration} min` : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.statSeparator} />
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>
              {distance > 0 ? formatDistance() : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.statSeparator} />
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pace</Text>
            <Text style={styles.statValue}>{formatPace()}</Text>
          </View>
        </View>
        
        {/* Target Progress (only shown if target is set and walking or completed) */}
        {targetDistance && (isWalking || endTime) && (
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelContainer}>
              <Text style={styles.progressLabel}>Progress toward target:</Text>
              <Text style={styles.progressPercentage}>
                {completionPercentage.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${completionPercentage}%` },
                  completionPercentage >= 100 && styles.progressBarComplete
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {(distance/1000).toFixed(2)} km / {(targetDistance/1000).toFixed(1)} km
              {completionPercentage >= 100 && " ✅"}
            </Text>
          </View>
        )}
        
        {/* Walk Summary (only shown after walk is completed) */}
        {endTime && targetDistance && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Walk Summary</Text>
            <View style={styles.summaryItem}>
              <FontAwesome5 name="check-circle" size={18} color="#10B981" style={styles.summaryIcon} />
              <Text style={styles.summaryText}>
                Distance Walked: <Text style={styles.summaryHighlight}>{formatDistance()}</Text>
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <FontAwesome5 name="bullseye" size={18} color="#8B5CF6" style={styles.summaryIcon} />
              <Text style={styles.summaryText}>
                Target: <Text style={styles.summaryHighlight}>{formatTargetDistance()}</Text>
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <FontAwesome5 
                name="fire" 
                size={18} 
                color={completionPercentage >= 100 ? "#F59E0B" : "#6B7280"} 
                style={styles.summaryIcon} 
              />
              <Text style={styles.summaryText}>
                Completion: <Text style={[
                  styles.summaryHighlight, 
                  completionPercentage >= 100 ? styles.completionSuccess : {}
                ]}>
                  {completionPercentage.toFixed(0)}%
                </Text>
              </Text>
            </View>
            {completionPercentage >= 100 && (
              <Text style={styles.motivationalText}>
                Great job! You exceeded your target distance! 🎉
              </Text>
            )}
          </View>
        )}
        
        {/* Time Details Section - Refactored to be side by side */}
        <View style={styles.timeDetailsSection}>
          <View style={styles.timeRow}>
            {/* Start Time */}
            <View style={styles.timeDetail}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{formatTime(startTime)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.timeEditButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <FontAwesome5 name="clock" size={18} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              
              {showStartPicker && (
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(event, selectedTime) => onTimeChange(event, selectedTime, 'start')}
                />
              )}
            </View>
            
            {/* End Time */}
            <View style={styles.timeDetail}>
              <Text style={styles.timeLabel}>End Time</Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{formatTime(endTime)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.timeEditButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <FontAwesome5 name="clock" size={18} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              
              {showEndPicker && (
                <DateTimePicker
                  value={endTime || new Date()}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(event, selectedTime) => onTimeChange(event, selectedTime, 'end')}
                />
              )}
            </View>
          </View>
        </View>
        
        {/* Notes Section - Moved directly under time section */}
        <View style={styles.notesSection}>
          <Text style={styles.timeLabel}>Notes</Text>
          <TextInput
            placeholder="Add notes about this walk..."
            value={notes}
            onChangeText={setNotes}
            style={styles.notesInput}
            multiline={true}
            numberOfLines={4}
          />
        </View>
        
        {/* Save Walk Button - Placed at bottom after notes */}
        <TouchableOpacity 
          style={[
            styles.saveWalkButton,
            selectedDogs.length === 0 && styles.disabledButton
          ]}
          onPress={handleSaveWalk}
          disabled={isSaving || selectedDogs.length === 0}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <FontAwesome5 name="save" size={16} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Save Walk</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Extra space at bottom to ensure content isn't hidden by footer */}
        <View style={{ height: 80 }} />
      </Animated.ScrollView>
      
      {/* Dog Selection Modal */}
      <Modal
        transparent={true}
        visible={dogModalVisible}
        animationType="slide"
        onRequestClose={() => setDogModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Dogs for Walk</Text>
              <TouchableOpacity 
                onPress={() => setDogModalVisible(false)}
              >
                <FontAwesome5 name="times" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            {/* Select All Option */}
            <TouchableOpacity 
              style={styles.selectAllContainer}
              onPress={() => {
                // If all are already selected, unselect all, else select all
                if (selectedDogs.length === dogs.length) {
                  setSelectedDogs([]);
                } else {
                  setSelectedDogs([...dogs]);
                }
              }}
            >
              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox, 
                  selectedDogs.length === dogs.length && styles.checkboxSelected
                ]}>
                  {selectedDogs.length === dogs.length && (
                    <FontAwesome5 name="check" size={12} color="white" />
                  )}
                </View>
              </View>
              <Text style={styles.selectAllText}>All Dogs</Text>
            </TouchableOpacity>
            
            <FlatList
              data={dogs}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.dogItem}
                  onPress={() => {
                    // Toggle selection
                    const isCurrentlySelected = selectedDogs.some(dog => dog.id === item.id);
                    
                    if (isCurrentlySelected) {
                      // Remove from selection
                      setSelectedDogs(selectedDogs.filter(dog => dog.id !== item.id));
                    } else {
                      // Add to selection
                      setSelectedDogs([...selectedDogs, item]);
                    }
                  }}
                >
                  <View style={styles.dogSelectionRow}>
                    <View style={styles.dogProfile}>
                      {/* Dog Avatar */}
                      <View style={styles.dogAvatarContainer}>
                        {item.photo_url ? (
                          <Image 
                            source={{ uri: item.photo_url }} 
                            style={styles.dogAvatar} 
                          />
                        ) : (
                          <View style={styles.dogAvatarPlaceholder}>
                            <FontAwesome5 name="dog" size={18} color="#8B5CF6" />
                          </View>
                        )}
                      </View>
                      
                      {/* Dog Name */}
                      <Text style={styles.dogItemText}>{item.name}</Text>
                    </View>
                    
                    {/* Checkbox */}
                    <View style={styles.checkboxContainer}>
                      <View style={[
                        styles.checkbox, 
                        selectedDogs.some(dog => dog.id === item.id) && styles.checkboxSelected
                      ]}>
                        {selectedDogs.some(dog => dog.id === item.id) && (
                          <FontAwesome5 name="check" size={12} color="white" />
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noDogsText}>No dogs found</Text>
              }
            />
            
            <TouchableOpacity 
              style={[
                styles.doneButton,
                selectedDogs.length === 0 && styles.disabledButton
              ]}
              onPress={() => {
                if (selectedDogs.length > 0) {
                  // If only one dog selected, also update selectedDog for backwards compatibility
                  if (selectedDogs.length === 1) {
                    setSelectedDog(selectedDogs[0]);
                  }
                  setDogModalVisible(false);
                } else {
                  Alert.alert("Error", "Please select at least one dog");
                }
              }}
              disabled={selectedDogs.length === 0}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
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
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  mapContainer: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  permissionError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionErrorText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
  targetDistanceSection: {
    marginBottom: 20,
  },
  targetInputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  targetInput: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    marginBottom: 12,
  },
  targetButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  targetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  setButton: {
    backgroundColor: '#8B5CF6',
  },
  setButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  setTargetButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  setTargetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statSeparator: {
    width: 1,
    height: '70%',
    backgroundColor: '#E5E7EB',
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  progressBarComplete: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryIcon: {
    marginRight: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#4B5563',
  },
  summaryHighlight: {
    fontWeight: '600',
    color: '#1F2937',
  },
  completionSuccess: {
    color: '#10B981',
  },
  motivationalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
    marginTop: 12,
  },
  walkControlsContainer: {
    marginBottom: 20,
  },
  walkButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walkButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  startButton: {
    marginRight: 8,
  },
  stopButton: {
    marginLeft: 8,
  },
  saveWalkButton: {
    backgroundColor: '#8B5CF6',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timeDetailsSection: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeDetail: {
    width: '48%',
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeDisplay: {
    flex: 1,
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeText: {
    fontSize: 16,
    color: '#1F2937',
  },
  timeEditButton: {
    padding: 12,
    marginLeft: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dogSelector: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  selectedDogContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dogIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedDogText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectDogPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectDogText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  loadingDogs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  noDogs: {
    alignItems: 'center',
    padding: 12,
  },
  noDogsText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  addDogButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addDogButtonText: {
    color: 'white',
    fontWeight: '500',
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
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dogItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dogItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dogSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dogProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dogAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dogAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  dogAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walkingDogText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectDogsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
  },
  selectDogsText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.8,
  },
  singleDogContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AddWalkScreen; 