import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation, CommonActions, StackActions } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';

const OnboardingCompleteScreen = () => {
  const navigation = useNavigation();
  const { user, refreshProfile } = useAuth();

  const handleFinish = async () => {
    try {
      console.log('Finish button pressed');
      
      // Skip the database update since the onboarding_completed column doesn't exist
      // Just navigate directly to the main app
      
      // Force navigation using direct approach
      console.log('Navigating to main app...');
      
      // Use a direct method that should work in most cases
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      
    } catch (error) {
      console.error('Error in handleFinish:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="check-circle" size={80} color="#10B981" />
        </View>
        
        <Text style={styles.title}>You're all set!</Text>
        
        <Text style={styles.description}>
          You've completed the initial setup. Now you can start tracking your dog's activities
          and enjoy all the features of Pooch Necessities!
        </Text>
        
        <View style={styles.dogImageContainer}>
          <FontAwesome5 name="dog" size={100} color="#8B5CF6" />
        </View>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <FontAwesome5 name="map-marker-alt" size={24} color="#8B5CF6" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Track Walks</Text>
              <Text style={styles.featureDescription}>Log walks and view your routes on a map</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <FontAwesome5 name="clipboard-list" size={24} color="#8B5CF6" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Activity Log</Text>
              <Text style={styles.featureDescription}>Keep track of all your dog's activities</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <FontAwesome5 name="calendar-alt" size={24} color="#8B5CF6" />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Reminders</Text>
              <Text style={styles.featureDescription}>Never miss important pet care tasks</Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleFinish}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Let's Get Started!</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  dogImageContainer: {
    marginBottom: 32,
    backgroundColor: '#F3E8FF',
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingCompleteScreen; 