import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

const OnboardingWelcomeScreen = () => {
  const navigation = useNavigation();
  const { profile } = useAuth();
  
  const firstName = profile?.full_name 
    ? profile.full_name.split(' ')[0] 
    : 'there';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <View style={styles.content}>
        <FontAwesome5 name="paw" size={60} color="#8B5CF6" style={styles.icon} />
        
        <Text style={styles.welcomeText}>Welcome, {firstName}!</Text>
        
        <Text style={styles.descriptionText}>
          Let's set up your pet's profile to help you track their activities and care.
        </Text>
        
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={styles.stepIcon}>
              <FontAwesome5 name="dog" size={18} color="white" />
            </View>
            <Text style={styles.stepText}>Add your dog(s)</Text>
          </View>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, styles.stepIconSecondary]}>
              <FontAwesome5 name="home" size={18} color="white" />
            </View>
            <Text style={styles.stepText}>Set home location (optional)</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('OnboardingAddDog')}
        >
          <Text style={styles.buttonText}>Let's Get Started</Text>
          <FontAwesome5 name="arrow-right" size={16} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  stepsContainer: {
    alignSelf: 'stretch',
    marginTop: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIconSecondary: {
    backgroundColor: '#10B981',
  },
  stepText: {
    fontSize: 16,
    color: '#4B5563',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingWelcomeScreen; 