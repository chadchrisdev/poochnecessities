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
import ActivityIcon from '../src/components/ActivityIcon';
import { Picker } from '@react-native-picker/picker';
import { navigateToActivityDetail } from '../src/utils/activityNavigationHelper';

const AddMedicationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { preselectedDogId } = route.params || {};
  
  // Form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [timeGiven, setTimeGiven] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [selectedDogId, setSelectedDogId] = useState(preselectedDogId || null);
  const [useExistingMedication, setUseExistingMedication] = useState(true);
  const [selectedMedicationId, setSelectedMedicationId] = useState(null);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dogs, setDogs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loadingDogs, setLoadingDogs] = useState(true);
  const [loadingMedications, setLoadingMedications] = useState(false);
  
  useEffect(() => {
    fetchDogs();
  }, []);
  
  // When dog selection changes, fetch that dog's medications
  useEffect(() => {
    if (selectedDogId) {
      fetchMedications(selectedDogId);
    } else {
      setMedications([]);
      setSelectedMedicationId(null);
    }
  }, [selectedDogId]);
  
  // When a medication is selected, pre-fill the form with its details
  useEffect(() => {
    if (selectedMedicationId && useExistingMedication) {
      const selectedMed = medications.find(med => med.id === selectedMedicationId);
      if (selectedMed) {
        setMedicationName(selectedMed.medication_name);
        setDosage(selectedMed.dosage);
        // Don't set frequency for the activity log
        setNotes(selectedMed.notes || '');
      }
    }
  }, [selectedMedicationId, useExistingMedication]);
  
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
        
        // If preselectedDogId is provided, use it; otherwise use the first dog
        const dogToSelect = preselectedDogId || data[0].id;
        setSelectedDogId(dogToSelect);
      }
    } catch (error) {
      console.error('Error fetching dogs:', error);
      Alert.alert('Error', 'Failed to load your dogs');
    } finally {
      setLoadingDogs(false);
    }
  };
  
  const fetchMedications = async (dogId) => {
    try {
      setLoadingMedications(true);
      
      // Fetch active medications for this dog (where end_date is null or in the future)
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('dog_id', dogId)
        .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`)
        .order('medication_name');
        
      if (error) {
        throw error;
      }
      
      setMedications(data || []);
      
      // Select the first medication if available
      if (data && data.length > 0) {
        setSelectedMedicationId(data[0].id);
      } else {
        setSelectedMedicationId(null);
        // If no medications found, switch to one-off mode
        setUseExistingMedication(false);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Error', 'Failed to load medications for this dog');
      setMedications([]);
      setSelectedMedicationId(null);
    } finally {
      setLoadingMedications(false);
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
      
      if (!timeGiven) {
        Alert.alert('Error', 'Please select a time');
        setSaving(false);
        return;
      }
      
      if (useExistingMedication && !selectedMedicationId) {
        Alert.alert('Error', 'Please select a medication or add a new one');
        setSaving(false);
        return;
      }
      
      if (!useExistingMedication && !medicationName.trim()) {
        Alert.alert('Error', 'Please enter medication name');
        setSaving(false);
        return;
      }
      
      // Prepare medication activity data
      const medicationData = {
        activity_type: 'medication',
        dog_id: selectedDogId,
        start_time: timeGiven.toISOString(),
        notes: notes.trim(),
      };
      
      // If using existing medication, link to it
      if (useExistingMedication && selectedMedicationId) {
        medicationData.medication_id = selectedMedicationId;
      } else {
        // For one-off medications, store details in the details field
        medicationData.details = JSON.stringify({
          medication_name: medicationName.trim(),
          dosage: dosage.trim(),
          frequency: frequency.trim()
        });
      }
      
      // Insert activity in Supabase
      const { data, error } = await supabase
        .from('activities')
        .insert(medicationData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating medication activity:', error);
        Alert.alert('Error', 'Failed to create medication record');
        return;
      }
      
      Alert.alert(
        "Success", 
        "Medication recorded successfully!",
        [
          { 
            text: "OK", 
            onPress: () => {
              // Navigate to the appropriate detail screen
              if (data && data.id) {
                navigateToActivityDetail(navigation, data.id, 'medication');
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
  
  const handleTimeChange = (date) => {
    setTimeGiven(date);
    setShowTimePicker(false);
  };
  
  const formatTimeForDisplay = (time) => {
    if (!time) return 'Not set';
    return format(time, 'MMM d, yyyy h:mm a');
  };
  
  const handleToggleUseExisting = () => {
    setUseExistingMedication(!useExistingMedication);
    
    // Clear form fields when switching modes
    if (useExistingMedication) {
      // Moving to one-off mode
      setMedicationName('');
      setDosage('');
      setFrequency('');
      setNotes('');
    } else if (selectedMedicationId) {
      // Moving to existing medication mode, pre-fill from selected med
      const selectedMed = medications.find(med => med.id === selectedMedicationId);
      if (selectedMed) {
        setMedicationName(selectedMed.medication_name);
        setDosage(selectedMed.dosage);
        setNotes(selectedMed.notes || '');
      }
    }
  };
  
  const goToManageMedications = () => {
    // Save the state to return to later
    navigation.navigate('ManageMedications', { 
      dogId: selectedDogId,
      returnToAddMedication: true
    });
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
        <Text style={styles.headerTitle}>Record Medication</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Activity Type (Read-only for Medication) */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Activity Type</Text>
          <View style={styles.activityTypeSelector}>
            <View style={styles.activityTypeSelectorContent}>
              <View style={styles.activityIconContainer}>
                <ActivityIcon type="medication" size={24} />
              </View>
              <Text style={styles.activityTypeText}>Medication</Text>
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
              enabled={!preselectedDogId} // Disable if dog is preselected
            >
              {dogs.map((dog) => (
                <Picker.Item key={dog.id} label={dog.name} value={dog.id} />
              ))}
            </Picker>
          </View>
        </View>
        
        {/* Medication Selection Toggle */}
        <View style={styles.formSection}>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>
              {useExistingMedication ? 'Select from scheduled medications' : 'Record one-time medication'}
            </Text>
            <Switch
              value={useExistingMedication}
              onValueChange={handleToggleUseExisting}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          {useExistingMedication ? (
            <>
              {/* Existing Medication Selector */}
              {loadingMedications ? (
                <View style={styles.loadingMedsContainer}>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text style={styles.loadingMedsText}>Loading medications...</Text>
                </View>
              ) : medications.length > 0 ? (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedMedicationId}
                    onValueChange={(itemValue) => setSelectedMedicationId(itemValue)}
                    style={styles.picker}
                  >
                    {medications.map((med) => (
                      <Picker.Item 
                        key={med.id}
                        label={`${med.medication_name} - ${med.dosage}`}
                        value={med.id}
                      />
                    ))}
                  </Picker>
                </View>
              ) : (
                <View style={styles.noMedsContainer}>
                  <Text style={styles.noMedsText}>No scheduled medications found for this dog</Text>
                </View>
              )}
              
              {/* Button to manage medications */}
              <TouchableOpacity 
                style={styles.manageMedsButton}
                onPress={goToManageMedications}
              >
                <Text style={styles.manageMedsButtonText}>
                  {medications.length > 0 ? 'Manage Scheduled Medications' : 'Add Scheduled Medication'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* One-time Medication Details */}
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
              
              <View style={styles.inputSection}>
                <Text style={styles.fieldLabel}>Frequency (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={frequency}
                  onChangeText={setFrequency}
                  placeholder="Enter frequency (e.g., Once daily)"
                />
              </View>
            </>
          )}
        </View>
        
        {/* Time */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Time</Text>
          
          <View style={styles.timeSection}>
            <Text style={styles.fieldLabel}>Time Given</Text>
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={() => setShowTimePicker(true)}
            >
              <FontAwesome5 name="clock" size={18} color="#6B7280" style={styles.timeIcon} />
              <Text style={styles.timeText}>{formatTimeForDisplay(timeGiven)}</Text>
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
            placeholder="Add notes about this medication..."
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
            <Text style={styles.saveButtonText}>Save Medication</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Date Time Picker */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="datetime"
        onConfirm={handleTimeChange}
        onCancel={() => setShowTimePicker(false)}
        date={timeGiven || new Date()}
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    flex: 1,
  },
  loadingMedsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingMedsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  noMedsContainer: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 16,
  },
  noMedsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  manageMedsButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageMedsButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
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

export default AddMedicationScreen; 