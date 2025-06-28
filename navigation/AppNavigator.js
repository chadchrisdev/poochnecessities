import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import DogProfileScreen from '../screens/DogProfileScreen';
import DogDetailsScreen from '../screens/DogDetailsScreen';
import LogActivityScreen from '../screens/LogActivityScreen';
import AddWalkScreen from '../screens/AddWalkScreen';
import WalkHistoryScreen from '../screens/WalkHistoryScreen';
import AddDogScreen from '../screens/AddDogScreen';
import EditDogScreen from '../screens/EditDogScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import EditActivityScreen from '../screens/EditActivityScreen';

// Import activity-specific detail and edit screens
import WalkDetailScreen from '../screens/WalkDetailScreen';
import FeedingDetailScreen from '../screens/FeedingDetailScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import SimpleDetailScreen from '../screens/SimpleDetailScreen';

import EditWalkScreen from '../screens/EditWalkScreen';
import EditFeedingScreen from '../screens/EditFeedingScreen';
import EditMedicationScreen from '../screens/EditMedicationScreen';
import SimpleEditScreen from '../screens/SimpleEditScreen';

// Import activity selection and creation screens
import AddActivityScreen from '../screens/AddActivityScreen';
import AddSimpleActivityScreen from '../screens/AddSimpleActivityScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import AddFeedingScreen from '../screens/AddFeedingScreen';

// Import onboarding navigator
import OnboardingNavigator from './OnboardingNavigator';

// Import Auth Context
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator with Add Button in the tabbar
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ fontSize: 12, color: color, marginTop: -5, paddingBottom: 4 }}>Home</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ActivitiesTab" 
        component={ActivitiesScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ fontSize: 12, color: color, marginTop: -5, paddingBottom: 4 }}>Activities</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-alt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="AddTab" 
        component={AddActivityScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={styles.addButtonContainer}>
              <View style={styles.addButton}>
                <FontAwesome5 name="plus" size={22} color="white" />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="DogsTab" 
        component={DogProfileScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ fontSize: 12, color: color, marginTop: -5, paddingBottom: 4 }}>Dogs</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="paw" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ fontSize: 12, color: color, marginTop: -5, paddingBottom: 4 }}>Profile</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root navigator that handles authentication flow
const AppStack = () => {
  const { user, loading, profileCompleted } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  // Determine initial route
  let initialRouteName = 'Login';
  if (user) {
    initialRouteName = profileCompleted ? 'Main' : 'ProfileSetup';
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Auth screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      
      {/* Profile setup screen */}
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      
      {/* Onboarding screens */}
      <Stack.Screen name="OnboardingWelcome" component={OnboardingNavigator} initialParams={{ screen: 'OnboardingWelcome' }} />
      <Stack.Screen name="OnboardingAddDog" component={OnboardingNavigator} initialParams={{ screen: 'OnboardingAddDog' }} />
      <Stack.Screen name="OnboardingAddress" component={OnboardingNavigator} initialParams={{ screen: 'OnboardingAddress' }} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingNavigator} initialParams={{ screen: 'OnboardingComplete' }} />
      
      {/* Main app with tab navigator */}
      <Stack.Screen name="Main" component={MainTabNavigator} />
      
      {/* App screens */}
      <Stack.Screen name="LogActivity" component={LogActivityScreen} />
      <Stack.Screen name="AddWalk" component={AddWalkScreen} />
      <Stack.Screen name="WalkHistory" component={WalkHistoryScreen} />
      <Stack.Screen name="AddDog" component={AddDogScreen} />
      <Stack.Screen name="EditDog" component={EditDogScreen} />
      <Stack.Screen name="DogDetails" component={DogDetailsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <Stack.Screen name="EditActivity" component={EditActivityScreen} />
      
      {/* Activity-specific detail screens */}
      <Stack.Screen name="WalkDetail" component={WalkDetailScreen} />
      <Stack.Screen name="FeedingDetail" component={FeedingDetailScreen} />
      <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
      <Stack.Screen name="SimpleDetail" component={SimpleDetailScreen} />
      
      {/* Activity-specific edit screens */}
      <Stack.Screen name="EditWalk" component={EditWalkScreen} />
      <Stack.Screen name="EditFeeding" component={EditFeedingScreen} />
      <Stack.Screen name="EditMedication" component={EditMedicationScreen} />
      <Stack.Screen name="SimpleEdit" component={SimpleEditScreen} />
      
      {/* Activity creation screens */}
      <Stack.Screen name="AddSimpleActivity" component={AddSimpleActivityScreen} />
      <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
      <Stack.Screen name="AddFeeding" component={AddFeedingScreen} />
    </Stack.Navigator>
  );
};

// Main app component with auth provider
const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppStack />
      </NavigationContainer>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    top: -5,
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default AppNavigator; 