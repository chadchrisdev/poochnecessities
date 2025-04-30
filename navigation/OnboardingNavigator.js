import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingWelcomeScreen from '../screens/Onboarding/OnboardingWelcomeScreen';
import OnboardingAddDogScreen from '../screens/Onboarding/OnboardingAddDogScreen';
import OnboardingAddressScreen from '../screens/Onboarding/OnboardingAddressScreen';
import OnboardingCompleteScreen from '../screens/Onboarding/OnboardingCompleteScreen';

const OnboardingStack = createNativeStackNavigator();

const OnboardingNavigator = () => {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <OnboardingStack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <OnboardingStack.Screen name="OnboardingAddDog" component={OnboardingAddDogScreen} />
      <OnboardingStack.Screen name="OnboardingAddress" component={OnboardingAddressScreen} />
      <OnboardingStack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </OnboardingStack.Navigator>
  );
};

export default OnboardingNavigator; 