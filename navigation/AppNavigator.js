import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ActivityLogScreen from '../screens/ActivityLogScreen';
import DogProfileScreen from '../screens/DogProfileScreen';
import LogActivityScreen from '../screens/LogActivityScreen';
import AddWalkScreen from '../screens/AddWalkScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
        <Stack.Screen name="DogProfiles" component={DogProfileScreen} />
        <Stack.Screen name="LogActivity" component={LogActivityScreen} />
        <Stack.Screen name="AddWalk" component={AddWalkScreen} />
        {/* Add more screens here as they are created */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 