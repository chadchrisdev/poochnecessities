import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { format, parseISO } from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ActivityIcon from '../src/components/ActivityIcon';

const EditWalkScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { activityId } = route.params;
  
  // Form state
  const [activity, setActivity] = useState(null);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceMeters, setDistanceMeters] = useState('');
  const [notes, setNotes] = useState('');
  const [dogId, setDogId] = useState(null);
  const [dogName, setDogName] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
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
            name
          )
        `)
        .eq('id', activityId)
        .single();
      
      if (error) {
        console.error('Error fetching walk:', error);
        Alert.alert('Error', 'Failed to load walk details');
        return;
      }
      
      if (!data) {
        Alert.alert('Error', 'Walk not found');
        navigation.goBack();
        return;
      }
      
      if (data.activity_type !== 'walk') {
        Alert.alert('Error', 'This is not a walk activity');
        navigation.goBack();
        return;
      }
      
      // Populate form state with activity data
      setActivity(data);
      setStartTime(data.start_time ? new Date(data.start_time) : new Date());
      
      if (data.end_time) {
        setEndTime(new Date(data.end_time));
      }
      
      setDurationMinutes(data.duration_minutes ? data.duration_minutes.toString() : '');
      setDistanceMeters(data.distance_meters ? data.distance_meters.toString() : '');
      setNotes(data.notes || '');
      setDogId(data.dog_id || null);
      
      if (data.dogs) {
        setDogName(data.dogs.name || '');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveActivity = async () => {
    try {
      setSaving(true);
      
      if (!startTime) {
        Alert.alert('Error', 'Please select a start time');
        setSaving(false);
        return;
      }
      
      // Prepare walk data for update
      const walkData = {
        activity_type: 'walk',
        start_time: startTime.toISOString(),
        notes: notes.trim(),
      };
      
      // Add optional fields if they have values
      if (endTime) {
        walkData.end_time = endTime.toISOString();
      }
      
      if (durationMinutes && !isNaN(parseInt(durationMinutes))) {
        walkData.duration_minutes = parseInt(durationMinutes);
      }
      
      if (distanceMeters && !isNaN(parseFloat(distanceMeters))) {
        walkData.distance_meters = parseFloat(distanceMeters);
      }
      
      // Update activity in Supabase
      const { error } = await supabase
        .from('activities')
        .update(walkData)
        .eq('id', activityId);
      
      if (error) {
        console.error('Error updating walk:', error);
        Alert.alert('Error', 'Failed to update walk');
        return;
      }
      
      Alert.alert(
        "Success", 
        "Walk updated successfully!",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('WalkDetail', { activityId }) 
          }
        ]
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };
  
  const handleStartTimeChange = (date) => {
    setStartTime(date);
    setShowStartTimePicker(false);
    
    // Update end time if it's before the new start time
    if (endTime && endTime < date) {
      setEndTime(date);
    }
  };
  
  const handleEndTimeChange = (date) => {
    setEndTime(date);
    setShowEndTimePicker(false);
    
    // Calculate duration if both times are set
    if (startTime && date) {
      const durationMs = date.getTime() - startTime.getTime();
      const durationMins = Math.round(durationMs / (1000 * 60));
      
      if (durationMins >= 0) {
        setDurationMinutes(durationMins.toString());
      }
    }
  };
  
  const formatTimeForDisplay = (time) => {
    if (!time) return 'Not set';
    return format(time, 'MMM d, yyyy h:mm a');
  };
  
  // Show loading indicator
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading walk details...</Text>
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
        <Text style={styles.headerTitle}>Edit Walk</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Activity Type (Read-only for Walk) */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Activity Type</Text>
          <View style={styles.activityTypeSelector}>
            <View style={styles.activityTypeSelectorContent}>
              <View style={styles.activityIconContainer}>
                <ActivityIcon type="walk" size={24} />
              </View>
              <Text style={styles.activityTypeText}>Walk</Text>
            </View>
          </View>
        </View>
        
        {/* Dog Info (read-only) */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Dog</Text>
          <View style={styles.infoField}>
            <FontAwesome5 name="dog" size={18} color="#8B5CF6" style={styles.infoIcon} />
            <Text style={styles.infoText}>{dogName || 'Unknown Dog'}</Text>
          </View>
        </View>
        
        {/* Date & Time */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          {/* Start Time */}
          <View style={styles.timeSection}>
            <Text style={styles.fieldLabel}>Start Time</Text>
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={() => setShowStartTimePicker(true)}
            >
              <FontAwesome5 name="clock" size={18} color="#6B7280" style={styles.timeIcon} />
              <Text style={styles.timeText}>{formatTimeForDisplay(startTime)}</Text>
            </TouchableOpacity>
          </View>
          
          {/* End Time */}
          <View style={styles.timeSection}>
            <Text style={styles.fieldLabel}>End Time (Optional)</Text>
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={() => setShowEndTimePicker(true)}
            >
              <FontAwesome5 name="clock" size={18} color="#6B7280" style={styles.timeIcon} />
              <Text style={styles.timeText}>{endTime ? formatTimeForDisplay(endTime) : 'Not set'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Duration & Distance */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          {/* Duration */}
          <View style={styles.detailSection}>
            <Text style={styles.fieldLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="Enter duration in minutes"
              keyboardType="numeric"
            />
          </View>
          
          {/* Distance for walks */}
          <View style={styles.detailSection}>
            <Text style={styles.fieldLabel}>Distance (meters)</Text>
            <TextInput
              style={styles.input}
              value={distanceMeters}
              onChangeText={setDistanceMeters}
              placeholder="Enter distance in meters"
              keyboardType="numeric"
            />
          </View>
        </View>
        
        {/* Notes */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this walk..."
            multiline={true}
            numberOfLines={4}
          />
        </View>
        
        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveActivity}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Date Time Pickers */}
      <DateTimePickerModal
        isVisible={showStartTimePicker}
        mode="datetime"
        onConfirm={handleStartTimeChange}
        onCancel={() => setShowStartTimePicker(false)}
        date={startTime || new Date()}
      />
      
      <DateTimePickerModal
        isVisible={showEndTimePicker}
        mode="datetime"
        onConfirm={handleEndTimeChange}
        onCancel={() => setShowEndTimePicker(false)}
        date={endTime || startTime || new Date()}
        minimumDate={startTime}
      />
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
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  activityTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  activityTypeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  activityTypeText: {
    fontSize: 16,
    color: '#1F2937',
  },
  infoField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1F2937',
  },
  timeSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  timeIcon: {
    marginRight: 12,
  },
  timeText: {
    fontSize: 16,
    color: '#1F2937',
  },
  detailSection: {
    marginBottom: 16,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  notesInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditWalkScreen; 