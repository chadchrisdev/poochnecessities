import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions 
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { subMonths } from 'date-fns';
import { supabase } from '../lib/supabase';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// Conversion constants
const LBS_TO_KG = 0.45359237;
const KG_TO_LBS = 2.20462262;

const WeightTracking = ({ dogId }) => {
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 6m, all
  const [unitSystem, setUnitSystem] = useState('kg'); // 'kg' or 'lbs'
  
  // Date picker state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [dateForDisplay, setDateForDisplay] = useState(format(new Date(), 'MMM d, yyyy'));

  // Unit conversion helpers
  const convertKgToLbs = (kg) => {
    return (parseFloat(kg) * KG_TO_LBS).toFixed(1);
  };

  const convertLbsToKg = (lbs) => {
    return (parseFloat(lbs) * LBS_TO_KG).toFixed(1);
  };

  // Handle unit system change
  const toggleUnitSystem = (newUnitSystem) => {
    if (newUnitSystem === unitSystem) return;
    
    // Convert weight input if there's a value
    if (weight) {
      if (newUnitSystem === 'lbs') {
        setWeight(convertKgToLbs(weight));
      } else {
        setWeight(convertLbsToKg(weight));
      }
    }
    
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

  const fetchWeights = async () => {
    if (!dogId) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('weights')
        .select('*')
        .eq('dog_id', dogId)
        .order('recorded_at', { ascending: true });
      
      // Apply time filter
      if (timeRange === '1m') {
        const oneMonthAgo = subMonths(new Date(), 1).toISOString();
        query = query.gte('recorded_at', oneMonthAgo);
      } else if (timeRange === '6m') {
        const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
        query = query.gte('recorded_at', sixMonthsAgo);
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

  const prepareChartData = (data) => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }
    
    const labels = data.map(item => format(parseISO(item.recorded_at), 'MM/dd'));
    let dataPoints;
    
    if (unitSystem === 'kg') {
      dataPoints = data.map(item => parseFloat(item.weight));
    } else {
      dataPoints = data.map(item => parseFloat(convertKgToLbs(item.weight)));
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

  const addWeight = async () => {
    if (!weight || isNaN(parseFloat(weight))) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Convert to kg for storage if in lbs
      let weightInKg = parseFloat(weight);
      if (unitSystem === 'lbs') {
        weightInKg = parseFloat(convertLbsToKg(weight));
      }
      
      const { data, error } = await supabase
        .from('weights')
        .insert([
          { 
            dog_id: dogId,
            weight: weightInKg,
            note: note.trim() || null,
            recorded_at: selectedDate.toISOString()
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Clear form and refresh data
      setWeight('');
      setNote('');
      setSelectedDate(new Date());
      setDateForDisplay(format(new Date(), 'MMM d, yyyy'));
      fetchWeights();
      
      Alert.alert('Success', 'Weight entry added successfully');
    } catch (error) {
      console.error('Error adding weight entry:', error);
      Alert.alert('Error', 'Failed to add weight entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch weights when component mounts or when time range changes
  useEffect(() => {
    fetchWeights();
  }, [dogId, timeRange]);

  // Update chart data when unit system changes
  useEffect(() => {
    if (weights.length > 0) {
      prepareChartData(weights);
    }
  }, [unitSystem]);

  // Get display weight for history items
  const getDisplayWeight = (weightKg) => {
    if (unitSystem === 'kg') {
      return `${weightKg} kg`;
    } else {
      return `${convertKgToLbs(weightKg)} lbs`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Tracking</Text>
      
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
      
      {/* Weight Entry Form */}
      <View style={styles.form}>
        {/* Date Picker Button */}
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={showDatePicker}
        >
          <FontAwesome5 name="calendar-alt" size={16} color="#6B7280" style={styles.dateIcon} />
          <Text style={styles.datePickerText}>{dateForDisplay}</Text>
        </TouchableOpacity>

        <View style={styles.inputRow}>
          <View style={styles.weightInputContainer}>
            <TextInput
              style={styles.weightInput}
              value={weight}
              onChangeText={setWeight}
              placeholder={`Weight (${unitSystem})`}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.unitText}>{unitSystem}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.addButton, !weight ? styles.addButtonDisabled : null]}
            onPress={addWeight}
            disabled={!weight || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <FontAwesome5 name="plus" size={12} color="white" />
                <Text style={styles.addButtonText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="Note (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
        />
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Math.max(Dimensions.get('window').width - 32, chartData.labels.length * 60)}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#8B5CF6'
              }
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      )}
      
      {/* Weight History List */}
      <Text style={styles.historyTitle}>Weight History</Text>
      {weights.length === 0 ? (
        <Text style={styles.noHistoryText}>No weight entries yet</Text>
      ) : (
        <ScrollView style={styles.historyList}>
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
        </ScrollView>
      )}

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={selectedDate}
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
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
  form: {
    marginBottom: 16,
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
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weightInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  weightInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1F2937',
  },
  unitText: {
    color: '#6B7280',
    fontSize: 16,
  },
  noteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 60,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 44,
  },
  addButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
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
  chart: {
    borderRadius: 12,
    paddingRight: 16,
    marginVertical: 8,
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
});

export default WeightTracking; 