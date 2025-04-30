import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';

const OnboardingAddressScreen = () => {
  const navigation = useNavigation();
  const { user, refreshProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    province: '',
    postal_code: '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkip = () => {
    navigation.navigate('OnboardingComplete');
  };

  const saveAddress = async () => {
    if (!formData.address || !formData.city) {
      Alert.alert("Error", "Please enter at least your address and city");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('users')
        .update({
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving address:', error);
        Alert.alert("Error", "Failed to save address");
        return;
      }

      // Refresh the user profile
      await refreshProfile();
      
      // Navigate to completion
      navigation.navigate('OnboardingComplete');
      
    } catch (error) {
      console.error('Unexpected error saving address:', error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home Address</Text>
        <View style={{ width: 20 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.infoContainer}>
            <FontAwesome5 name="info-circle" size={20} color="#3B82F6" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Adding your home address is optional but helps with tracking walks and finding nearby services.
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your street address"
              value={formData.address}
              onChangeText={(value) => handleChange('address', value)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your city"
              value={formData.city}
              onChangeText={(value) => handleChange('city', value)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Province/State</Text>
              <TextInput
                style={styles.input}
                placeholder="Province"
                value={formData.province}
                onChangeText={(value) => handleChange('province', value)}
                autoCapitalize="words"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="A1A 1A1"
                value={formData.postal_code}
                onChangeText={(value) => handleChange('postal_code', value)}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip for Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                (!formData.address || !formData.city) && styles.saveButtonDisabled
              ]}
              onPress={saveAddress}
              disabled={!formData.address || !formData.city || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save Address</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    color: '#1E40AF',
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  skipButton: {
    padding: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingAddressScreen; 