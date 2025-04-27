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
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

const { width } = Dimensions.get('window');
const DEFAULT_LATITUDE = 37.78825;
const DEFAULT_LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.005; // Smaller delta for closer zoom
const LONGITUDE_DELTA = 0.005;

const AddWalkScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  
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
    const now = new Date();
    setStartTime(now);
    setIsWalking(true);
  };
  
  // Handle stopping a walk
  const handleStopWalk = () => {
    const now = new Date();
    setEndTime(now);
    setIsWalking(false);
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
      
      {/* Map View */}
      <View style={styles.mapContainer}>
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
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            followsUserLocation
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
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
        
        {/* Timer Controls */}
        <View style={styles.timerControls}>
          <TouchableOpacity 
            style={[
              styles.timerButton, 
              styles.startButton,
              isWalking && styles.disabledButton
            ]}
            onPress={handleStartWalk}
            disabled={isWalking || locationPermission !== 'granted'}
          >
            <FontAwesome5 name="play" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.timerButtonText}>Start Walk</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.timerButton, 
              styles.stopButton,
              (!isWalking || endTime) && styles.disabledButton
            ]}
            onPress={handleStopWalk}
            disabled={!isWalking || endTime !== null}
          >
            <FontAwesome5 name="stop" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.timerButtonText}>Stop Walk</Text>
          </TouchableOpacity>
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
        
        {/* Time Details Section */}
        <View style={styles.timeDetailsSection}>
          {/* Start Time */}
          <View style={styles.timeDetail}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <View style={styles.timeRow}>
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
            <View style={styles.timeRow}>
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
        
        {/* Notes Section */}
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
      </ScrollView>
      
      {/* Save Button (Footer) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            // Later we'll save targetDistance and completionPercentage with the walk data
            // For now, just navigate back to HomeScreen
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.saveButtonText}>Save Walk</Text>
        </TouchableOpacity>
      </View>
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
  mapContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding at bottom for footer
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
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    width: '48%',
  },
  startButton: {
    backgroundColor: '#10B981', // Green
  },
  stopButton: {
    backgroundColor: '#EF4444', // Red
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  timerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timeDetailsSection: {
    marginBottom: 24,
  },
  timeDetail: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  timeRow: {
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
    marginBottom: 24,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddWalkScreen; 