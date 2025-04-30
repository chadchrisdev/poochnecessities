import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';

const LogActivityScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { activityType } = route.params;
  const [notes, setNotes] = useState('');
  
  // Add state for dog selection
  const [dogs, setDogs] = useState([]);
  const [selectedDog, setSelectedDog] = useState(null);
  const [dogsLoading, setDogsLoading] = useState(true);
  const [dogModalVisible, setDogModalVisible] = useState(false);
  
  // Add state for saving
  const [isSaving, setIsSaving] = useState(false);

  // Fetch dogs from Supabase
  const fetchDogs = async () => {
    try {
      setDogsLoading(true);
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching dogs:', error);
        Alert.alert('Error', 'Unable to load dogs');
        return;
      }

      setDogs(data || []);
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

  // Activity type icons mapping
  const getActivityIcon = () => {
    switch(activityType) {
      case 'Walk':
        return <FontAwesome5 name="map-marker-alt" size={24} color="#8B5CF6" />;
      case 'Pee':
        return <FontAwesome5 name="tint" size={24} color="#FBBF24" />;
      case 'Poop':
        return <Text style={styles.emojiIcon}>💩</Text>;
      default:
        return <FontAwesome5 name="paw" size={24} color="#8B5CF6" />;
    }
  };

  // Handle saving activity to Supabase
  const saveActivity = async () => {
    if (!selectedDog) {
      Alert.alert('Error', 'Please select a dog for this activity');
      return;
    }

    try {
      setIsSaving(true);
      
      const activityData = {
        activity_type: activityType.toLowerCase(),
        start_time: new Date().toISOString(),
        notes: notes.trim(),
        dog_id: selectedDog.id,
      };
      
      const { data, error } = await supabase
        .from('activities')
        .insert([activityData]);

      if (error) {
        console.error('Error saving activity:', error);
        Alert.alert('Error', 'Failed to save activity');
        return;
      }

      Alert.alert(
        "Success", 
        `${activityType} activity has been logged successfully!`,
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('HomeTab') 
          }
        ]
      );
    } catch (error) {
      console.error('Unexpected error saving activity:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log {activityType}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.content}>
        {/* Activity Type Section */}
        <View style={styles.activityTypeSection}>
          <View style={styles.activityIconContainer}>
            {getActivityIcon()}
          </View>
          <Text style={styles.activityTypeText}>{activityType}</Text>
        </View>

        {/* Dog Selection */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Select Dog</Text>
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
          ) : (
            <TouchableOpacity 
              style={styles.dogSelector}
              onPress={() => setDogModalVisible(true)}
            >
              {selectedDog ? (
                <View style={styles.selectedDogContainer}>
                  <View style={styles.dogIconContainer}>
                    <FontAwesome5 name="dog" size={18} color="#8B5CF6" />
                  </View>
                  <Text style={styles.selectedDogText}>{selectedDog.name}</Text>
                </View>
              ) : (
                <View style={styles.selectDogPlaceholder}>
                  <Text style={styles.selectDogText}>Select a dog</Text>
                  <FontAwesome5 name="chevron-down" size={16} color="#6B7280" />
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Notes Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            placeholder="Add any notes about this activity..."
            value={notes}
            onChangeText={setNotes}
            style={styles.textInput}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton, 
            (!selectedDog && dogs.length > 0) && styles.saveButtonDisabled
          ]}
          onPress={saveActivity}
          disabled={!selectedDog || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Activity</Text>
          )}
        </TouchableOpacity>
      </View>

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
              <Text style={styles.modalTitle}>Select a Dog</Text>
              <TouchableOpacity 
                onPress={() => setDogModalVisible(false)}
              >
                <FontAwesome5 name="times" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={dogs}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.dogItem}
                  onPress={() => {
                    setSelectedDog(item);
                    setDogModalVisible(false);
                  }}
                >
                  <View style={styles.dogIconContainer}>
                    <FontAwesome5 name="dog" size={18} color="#8B5CF6" />
                  </View>
                  <Text style={styles.dogItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noDogsText}>No dogs found</Text>
              }
            />
            
            <TouchableOpacity 
              style={styles.addDogButtonInModal}
              onPress={() => {
                setDogModalVisible(false);
                navigation.navigate('AddDog');
              }}
            >
              <FontAwesome5 name="plus" size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.addDogButtonText}>Add New Dog</Text>
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
    padding: 20,
  },
  activityTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityTypeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
  },
  emojiIcon: {
    fontSize: 24,
  },
  section: {
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
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
  saveButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dogSelector: {
    backgroundColor: 'white',
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  noDogs: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dogItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  addDogButtonInModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 8,
  },
});

export default LogActivityScreen; 