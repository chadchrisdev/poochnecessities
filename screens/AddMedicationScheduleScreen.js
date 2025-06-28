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
  Switch
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { format } from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';

const AddMedicationScheduleScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { dogId, returnToManageMedications } = route.params || {};
  
  // Form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDogId, setSelectedDogId] = useState(dogId || null);
  const [startDate, setStartDate] = useState(new Date());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(new Date());
  
  // Frequency state
  const [frequencyType, setFrequencyType] = useState('daily');
  const [timesPerDay, setTimesPerDay] = useState('1');
  const [intervalHours, setIntervalHours] = useState('12');
  const [daysInterval, setDaysInterval] = useState('1');
  const [customSchedule, setCustomSchedule] = useState('');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
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
        
        // If no dogId is provided, select the first dog
        if (!dogId) {
          setSelectedDogId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
      Alert.alert('Error', 'Failed to load your dogs');
    } finally {
      setLoadingDogs(false);
    }
  };
  
  const buildFrequencyJson = () => {
    // Create different frequency objects based on the selected frequency type
    switch (frequencyType) {
      case 'daily':
        return {
          timesPerDay: parseInt(timesPerDay, 10) || 1
        };
      
      case 'interval':
        return {
          intervalHours: parseInt(intervalHours, 10) || 12
        };
      
      case 'days':
        return {
          daysInterval: parseInt(daysInterval, 10) || 1
        };
      
      case 'custom':
        return {
          customSchedule: customSchedule.trim()
        };
      
      default:
        return { timesPerDay: 1 };
    }
  };
  
  const handleSaveMedication = async () => {
    try {
      setSaving(true);
      
      // Validation
      if (!selectedDogId) {
        Alert.alert('Error', 'Please select a dog');
        setSaving(false);
        return;
      }
      
      if (!medicationName.trim()) {
        Alert.alert('Error', 'Please enter medication name');
        setSaving(false);
        return;
      }
      
      if (!dosage.trim()) {
        Alert.alert('Error', 'Please enter dosage');
        setSaving(false);
        return;
      }
      
      if (frequencyType === 'custom' && !customSchedule.trim()) {
        Alert.alert('Error', 'Please enter custom schedule');
        setSaving(false);
        return;
      }
      
      // Create frequency JSON
      const frequencyData = buildFrequencyJson();
      
      // Prepare medication data
      const medicationData = {
        dog_id: selectedDogId,
        medication_name: medicationName.trim(),
        dosage: dosage.trim(),
        frequency: frequencyData,
        start_date: startDate.toISOString(),
        notes: notes.trim()
      };
      
      // Add end date if applicable
      if (hasEndDate) {
        medicationData.end_date = endDate.toISOString();
      }
      
      // Insert medication in Supabase
      const { data, error } = await supabase
        .from('medications')
        .insert(medicationData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating medication:', error);
        Alert.alert('Error', 'Failed to create medication schedule');
        return;
      }
      
      Alert.alert(
        "Success", 
        "Medication schedule created successfully!",
        [
          { 
            text: "OK", 
            onPress: () => {
              if (returnToManageMedications) {
                navigation.navigate('ManageMedications', { dogId: selectedDogId });
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
  
  const handleStartDateChange = (date) => {
    setStartDate(date);
    setShowStartDatePicker(false);
    
    // If end date is before start date, update end date
    if (hasEndDate && date > endDate) {
      setEndDate(date);
    }
  };
  
  const handleEndDateChange = (date) => {
    setEndDate(date);
    setShowEndDatePicker(false);
  };
  
  const formatDateForDisplay = (date) => {
    if (!date) return 'Not set';
    return format(date, 'MMM d, yyyy');
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
        <Text style={styles.headerTitle}>Add Medication Schedule</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Dog Selection */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Dog</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDogId}
              onValueChange={(itemValue) => setSelectedDogId(itemValue)}
              style={styles.picker}
              enabled={!dogId} // Disable if dog is preselected
            >
              {dogs.map((dog) => (
                <Picker.Item key={dog.id} label={dog.name} value={dog.id} />
              ))}
            </Picker>
          </View>
        </View>
        
        {/* Medication Details */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Medication Details</Text>
          
          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Medication Name</Text>
            <TextInput
              style={styles.input}
              value={medicationName}
              onChangeText={setMedicationName}
              placeholder="Enter medication name"
            />
          </View>
          
          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Dosage</Text>
            <TextInput
              style={styles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder="Enter dosage (e.g., 50mg, 1 tablet)"
            />
          </View>
        </View>
        
        {/* Schedule */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={() => setShowStartDatePicker(true)}
            >
              <FontAwesome5 name="calendar-alt" size={18} color="#6B7280" style={styles.dateIcon} />
              <Text style={styles.dateText}>{formatDateForDisplay(startDate)}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Has End Date</Text>
            <Switch
              value={hasEndDate}
              onValueChange={setHasEndDate}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          {hasEndDate && (
            <View style={styles.inputSection}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => setShowEndDatePicker(true)}
              >
                <FontAwesome5 name="calendar-alt" size={18} color="#6B7280" style={styles.dateIcon} />
                <Text style={styles.dateText}>{formatDateForDisplay(endDate)}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Frequency */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Frequency</Text>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={frequencyType}
              onValueChange={(itemValue) => setFrequencyType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Times per day" value="daily" />
              <Picker.Item label="Every X hours" value="interval" />
              <Picker.Item label="Every X days" value="days" />
              <Picker.Item label="Custom schedule" value="custom" />
            </Picker>
          </View>
          
          {frequencyType === 'daily' && (
            <View style={styles.inputSection}>
              <Text style={styles.fieldLabel}>Times Per Day</Text>
              <TextInput
                style={styles.input}
                value={timesPerDay}
                onChangeText={setTimesPerDay}
                placeholder="Enter number of times per day"
                keyboardType="numeric"
              />
            </View>
          )}
          
          {frequencyType === 'interval' && (
            <View style={styles.inputSection}>
              <Text style={styles.fieldLabel}>Interval Hours</Text>
              <TextInput
                style={styles.input}
                value={intervalHours}
                onChangeText={setIntervalHours}
                placeholder="Enter interval in hours"
                keyboardType="numeric"
              />
            </View>
          )}
          
          {frequencyType === 'days' && (
            <View style={styles.inputSection}>
              <Text style={styles.fieldLabel}>Days Interval</Text>
              <TextInput
                style={styles.input}
                value={daysInterval}
                onChangeText={setDaysInterval}
                placeholder="Enter interval in days"
                keyboardType="numeric"
              />
            </View>
          )}
          
          {frequencyType === 'custom' && (
            <View style={styles.inputSection}>
              <Text style={styles.fieldLabel}>Custom Schedule</Text>
              <TextInput
                style={styles.input}
                value={customSchedule}
                onChangeText={setCustomSchedule}
                placeholder="Enter custom schedule description"
                multiline={true}
                numberOfLines={2}
              />
            </View>
          )}
        </View>
        
        {/* Notes */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this medication..."
            multiline={true}
            numberOfLines={4}
          />
        </View>
        
        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveMedication}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Medication Schedule</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={handleStartDateChange}
        onCancel={() => setShowStartDatePicker(false)}
        date={startDate || new Date()}
      />
      
      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={handleEndDateChange}
        onCancel={() => setShowEndDatePicker(false)}
        date={endDate || new Date()}
        minimumDate={startDate} // End date must be after or on start date
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
  pickerContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 16,
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
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

export default AddMedicationScheduleScreen; 