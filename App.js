import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { presetAvatars } from './src/utils/savePresetAvatar';
import { Image } from 'react-native';

// Keep the splash screen visible while we fetch assets
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, avatar images, or other assets
        await Font.loadAsync({
          // Your custom fonts here if needed
        });
        
        // Pre-load avatar images
        const avatarPromises = presetAvatars.map(avatarUri => {
          return Image.prefetch(avatarUri);
        });
        
        await Promise.all(avatarPromises);
      } catch (e) {
        console.warn('Error loading assets:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
