import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { format, parseISO, isPast } from 'date-fns';

const ManageMedicationsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { dogId, returnToAddMedication } = route.params || {};
  
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dogName, setDogName] = useState('');
  
  useEffect(() => {
    fetchDogDetails();
    fetchMedications();
  }, []);
  
  const fetchDogDetails = async () => {
    if (!dogId) return;
    
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('name')
        .eq('id', dogId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setDogName(data.name);
      }
    } catch (error) {
      console.error('Error fetching dog details:', error);
    }
  };
  
  const fetchMedications = async () => {
    if (!dogId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('dog_id', dogId)
        .order('medication_name');
        
      if (error) throw error;
      
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteMedication = (medication) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication.medication_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMedication(medication.id)
        }
      ]
    );
  };
  
  const deleteMedication = async (medicationId) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId);
        
      if (error) throw error;
      
      // Remove medication from state
      setMedications(currentMedications => 
        currentMedications.filter(med => med.id !== medicationId)
      );
      
      Alert.alert('Success', 'Medication deleted successfully');
    } catch (error) {
      console.error('Error deleting medication:', error);
      Alert.alert('Error', 'Failed to delete medication');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddMedication = () => {
    navigation.navigate('AddMedicationSchedule', { 
      dogId,
      returnToManageMedications: true
    });
  };
  
  const handleEditMedication = (medication) => {
    navigation.navigate('EditMedicationSchedule', {
      medicationId: medication.id,
      returnToManageMedications: true
    });
  };
  
  const formatFrequency = (frequencyJson) => {
    try {
      if (!frequencyJson) return 'Not specified';
      
      // Parse if it's a string
      const frequency = typeof frequencyJson === 'string' 
        ? JSON.parse(frequencyJson) 
        : frequencyJson;
      
      if (frequency.timesPerDay && frequency.intervalHours) {
        return `${frequency.timesPerDay}x daily (every ${frequency.intervalHours} hours)`;
      } else if (frequency.timesPerDay) {
        return `${frequency.timesPerDay}x daily`;
      } else if (frequency.intervalHours) {
        return `Every ${frequency.intervalHours} hours`;
      } else if (frequency.daysInterval) {
        return `Every ${frequency.daysInterval} days`;
      } else if (frequency.specificDays && frequency.specificDays.length) {
        // Convert day numbers to names
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const days = frequency.specificDays.map(day => dayNames[day]).join(', ');
        return `On ${days}`;
      } else if (frequency.customSchedule) {
        return frequency.customSchedule;
      }
      
      return 'Custom schedule';
    } catch (e) {
      console.error('Error parsing frequency:', e);
      return 'Custom schedule';
    }
  };
  
  const formatDateRange = (startDate, endDate) => {
    try {
      const start = startDate ? format(parseISO(startDate), 'MMM d, yyyy') : 'Unknown';
      
      if (!endDate) return `From ${start} - Ongoing`;
      
      const end = format(parseISO(endDate), 'MMM d, yyyy');
      return `${start} to ${end}`;
    } catch (error) {
      return 'Invalid date range';
    }
  };
  
  const isMedicationExpired = (endDate) => {
    if (!endDate) return false;
    
    try {
      return isPast(parseISO(endDate));
    } catch (error) {
      return false;
    }
  };
  
  const renderMedicationItem = ({ item }) => {
    const isExpired = isMedicationExpired(item.end_date);
    
    return (
      <TouchableOpacity 
        style={[styles.medicationCard, isExpired && styles.expiredCard]}
        onPress={() => handleEditMedication(item)}
        activeOpacity={0.7}
      >
        <View style={styles.medicationHeader}>
          <View style={styles.medicationNameContainer}>
            <FontAwesome5 
              name="pills" 
              size={18} 
              color={isExpired ? '#9CA3AF' : '#EF4444'} 
              style={styles.medicationIcon}
            />
            <Text style={[styles.medicationName, isExpired && styles.expiredText]}>
              {item.medication_name}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMedication(item)}
          >
            <FontAwesome5 name="trash-alt" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.medicationDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dosage:</Text>
            <Text style={[styles.detailText, isExpired && styles.expiredText]}>
              {item.dosage}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Frequency:</Text>
            <Text style={[styles.detailText, isExpired && styles.expiredText]}>
              {formatFrequency(item.frequency)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Schedule:</Text>
            <Text style={[
              styles.detailText, 
              isExpired ? styles.expiredText : styles.periodText
            ]}>
              {formatDateRange(item.start_date, item.end_date)}
              {isExpired && ' (Expired)'}
            </Text>
          </View>
          
          {item.notes && (
            <View style={styles.notesRow}>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="pills" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Medications</Text>
      <Text style={styles.emptyText}>
        You haven't added any scheduled medications for {dogName || 'this dog'} yet.
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddMedication}
      >
        <Text style={styles.addButtonText}>Add Medication</Text>
      </TouchableOpacity>
    </View>
  );
  
  // If no dog ID was provided
  if (!dogId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Medications</Text>
          <View style={{width: 40}} />
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No dog selected</Text>
          <TouchableOpacity
            style={styles.backToDogsButton}
            onPress={() => navigation.navigate('Dogs')}
          >
            <Text style={styles.backToDogsText}>Go to Dogs</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {dogName ? `${dogName}'s Medications` : 'Medications'}
        </Text>
        <TouchableOpacity 
          style={styles.addIconButton}
          onPress={handleAddMedication}
        >
          <FontAwesome5 name="plus" size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={medications}
            renderItem={renderMedicationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyList}
          />
          
          {medications.length > 0 && (
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity
                style={styles.floatingAddButton}
                onPress={handleAddMedication}
              >
                <FontAwesome5 name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
  addIconButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom for floating button
  },
  medicationCard: {
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
  expiredCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  medicationNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicationIcon: {
    marginRight: 12,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  deleteButton: {
    padding: 8,
  },
  medicationDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
  },
  detailText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  periodText: {
    color: '#10B981',
  },
  expiredText: {
    color: '#9CA3AF',
  },
  notesRow: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  floatingAddButton: {
    backgroundColor: '#10B981',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  backToDogsButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToDogsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageMedicationsScreen; 