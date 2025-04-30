import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ActivityLogScreen from '../screens/ActivityLogScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import DogProfileScreen from '../screens/DogProfileScreen';
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

// Import onboarding navigator
import OnboardingNavigator from './OnboardingNavigator';

// Import Auth Context
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main app screens accessible via bottom tabs
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
      
      {/* App screens */}
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="LogActivity" component={LogActivityScreen} />
      <Stack.Screen name="AddWalk" component={AddWalkScreen} />
      <Stack.Screen name="WalkHistory" component={WalkHistoryScreen} />
      <Stack.Screen name="AddDog" component={AddDogScreen} />
      <Stack.Screen name="EditDog" component={EditDogScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
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
});

export default AppNavigator; 