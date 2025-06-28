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
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { format, parseISO } from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ActivityIcon from '../src/components/ActivityIcon';

const SimpleEditScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { activityId, activityType } = route.params;
  
  // Form state
  const [activity, setActivity] = useState(null);
  const [startTime, setStartTime] = useState(new Date());
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [dogId, setDogId] = useState(null);
  const [dogName, setDogName] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  
  useEffect(() => {
    fetchActivity();
  }, [activityId]);
  
  // Get proper title for activity type
  const getActivityTitle = (type) => {
    if (!type) return 'Activity';
    
    switch (type.toLowerCase()) {
      case 'pee':
        return 'Pee';
      case 'poop':
        return 'Poop';
      case 'water':
        return 'Water';
      case 'grooming':
        return 'Grooming';
      case 'play':
        return 'Play Time';
      case 'vet':
        return 'Vet Visit';
      case 'vomit':
        return 'Vomit';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
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
        console.error('Error fetching activity:', error);
        Alert.alert('Error', 'Failed to load activity details');
        return;
      }
      
      if (!data) {
        Alert.alert('Error', 'Activity not found');
        navigation.goBack();
        return;
      }
      
      // Populate form state with activity data
      setActivity(data);
      setStartTime(data.start_time ? new Date(data.start_time) : new Date());
      setDurationMinutes(data.duration_minutes ? data.duration_minutes.toString() : '');
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
        Alert.alert('Error', 'Please select a time');
        setSaving(false);
        return;
      }
      
      // Prepare activity data for update
      const activityData = {
        activity_type: activity.activity_type,
        start_time: startTime.toISOString(),
        notes: notes.trim(),
      };
      
      // Add duration if it exists
      if (durationMinutes && !isNaN(parseInt(durationMinutes))) {
        activityData.duration_minutes = parseInt(durationMinutes);
      }
      
      // Update activity in Supabase
      const { error } = await supabase
        .from('activities')
        .update(activityData)
        .eq('id', activityId);
      
      if (error) {
        console.error('Error updating activity:', error);
        Alert.alert('Error', 'Failed to update activity');
        return;
      }
      
      Alert.alert(
        "Success", 
        "Activity updated successfully!",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('SimpleDetail', { activityId, activityType: activity.activity_type }) 
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
        <Text style={styles.loadingText}>Loading activity details...</Text>
      </SafeAreaView>
    );
  }
  
  if (!activity) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Activity not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Edit {getActivityTitle(activity.activity_type)}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Activity Type (Read-only) */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Activity Type</Text>
          <View style={styles.activityTypeSelector}>
            <View style={styles.activityTypeSelectorContent}>
              <View style={styles.activityIconContainer}>
                <ActivityIcon type={activity.activity_type} size={24} />
              </View>
              <Text style={styles.activityTypeText}>{getActivityTitle(activity.activity_type)}</Text>
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
        
        {/* Time */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Time</Text>
          
          <View style={styles.timeSection}>
            <Text style={styles.fieldLabel}>Time</Text>
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={() => setShowStartTimePicker(true)}
            >
              <FontAwesome5 name="clock" size={18} color="#6B7280" style={styles.timeIcon} />
              <Text style={styles.timeText}>{formatTimeForDisplay(startTime)}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Duration - for some activities (optional) */}
          <View style={styles.timeSection}>
            <Text style={styles.fieldLabel}>Duration (minutes, optional)</Text>
            <TextInput
              style={styles.input}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="Enter duration in minutes"
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
            placeholder="Add notes about this activity..."
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
      
      {/* Date Time Picker */}
      <DateTimePickerModal
        isVisible={showStartTimePicker}
        mode="datetime"
        onConfirm={handleStartTimeChange}
        onCancel={() => setShowStartTimePicker(false)}
        date={startTime || new Date()}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
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

export default SimpleEditScreen; 