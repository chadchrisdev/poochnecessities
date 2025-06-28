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
import { format } from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ActivityIcon from '../src/components/ActivityIcon';
import { Picker } from '@react-native-picker/picker';
import { navigateToActivityDetail } from '../src/utils/activityNavigationHelper';

const AddFeedingScreen = () => {
  const navigation = useNavigation();
  
  // Form state
  const [foodType, setFoodType] = useState('');
  const [amount, setAmount] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [selectedDogId, setSelectedDogId] = useState(null);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [dogs, setDogs] = useState([]);
  const [loadingDogs, setLoadingDogs] = useState(true);
  
  useEffect(() => {
    fetchDogs();
  }, []);
  
  const fetchDogs = async () => {
    try {
      setLoadingDogs(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name')
        .eq('user_id', userData.user.id)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setDogs(data);
        setSelectedDogId(data[0].id); // Select the first dog by default
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
      Alert.alert('Error', 'Failed to load your dogs');
    } finally {
      setLoadingDogs(false);
    }
  };
  
  const handleSaveActivity = async () => {
    try {
      setSaving(true);
      
      if (!selectedDogId) {
        Alert.alert('Error', 'Please select a dog');
        setSaving(false);
        return;
      }
      
      if (!startTime) {
        Alert.alert('Error', 'Please select a time');
        setSaving(false);
        return;
      }
      
      // Prepare feeding activity data
      const feedingData = {
        activity_type: 'feeding',
        dog_id: selectedDogId,
        food_type: foodType.trim(),
        amount: amount.trim(),
        start_time: startTime.toISOString(),
        notes: notes.trim(),
      };
      
      // Insert activity in Supabase
      const { data, error } = await supabase
        .from('activities')
        .insert(feedingData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating feeding activity:', error);
        Alert.alert('Error', 'Failed to create feeding record');
        return;
      }
      
      Alert.alert(
        "Success", 
        "Feeding recorded successfully!",
        [
          { 
            text: "OK", 
            onPress: () => {
              // Navigate to the appropriate detail screen
              if (data && data.id) {
                navigateToActivityDetail(navigation, data.id, 'feeding');
              } else {
                navigation.goBack();
              }
            }
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
  
  // Show loading indicator while fetching dogs
  if (loadingDogs) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading your dogs...</Text>
      </SafeAreaView>
    );
  }
  
  if (dogs.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>You need to add a dog first</Text>
        <TouchableOpacity 
          style={styles.addDogButton}
          onPress={() => navigation.navigate('AddDog')}
        >
          <Text style={styles.addDogButtonText}>Add a Dog</Text>
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
        <Text style={styles.headerTitle}>Add Feeding</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Activity Type (Read-only for Feeding) */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Activity Type</Text>
          <View style={styles.activityTypeSelector}>
            <View style={styles.activityTypeSelectorContent}>
              <View style={styles.activityIconContainer}>
                <ActivityIcon type="feeding" size={24} />
              </View>
              <Text style={styles.activityTypeText}>Feeding</Text>
            </View>
          </View>
        </View>
        
        {/* Dog Selection */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Dog</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDogId}
              onValueChange={(itemValue) => setSelectedDogId(itemValue)}
              style={styles.picker}
            >
              {dogs.map((dog) => (
                <Picker.Item key={dog.id} label={dog.name} value={dog.id} />
              ))}
            </Picker>
          </View>
        </View>
        
        {/* Feeding Details */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Feeding Details</Text>
          
          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Food Type</Text>
            <TextInput
              style={styles.input}
              value={foodType}
              onChangeText={setFoodType}
              placeholder="Enter food type (e.g., Kibble, Wet Food)"
            />
          </View>
          
          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount (e.g., 1 cup, 200g)"
            />
          </View>
        </View>
        
        {/* Time */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Time</Text>
          
          <View style={styles.timeSection}>
            <Text style={styles.fieldLabel}>Feeding Time</Text>
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={() => setShowStartTimePicker(true)}
            >
              <FontAwesome5 name="clock" size={18} color="#6B7280" style={styles.timeIcon} />
              <Text style={styles.timeText}>{formatTimeForDisplay(startTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Notes */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this feeding..."
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
            <Text style={styles.saveButtonText}>Save Feeding</Text>
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
    textAlign: 'center',
  },
  addDogButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addDogButtonText: {
    color: 'white',
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
  pickerContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  inputSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  timeSection: {
    marginBottom: 16,
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

export default AddFeedingScreen; 