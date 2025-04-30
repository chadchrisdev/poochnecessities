import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signIn, signUpWithEmail } from '../services/authService';
import { supabase } from '../src/lib/supabase';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        navigation.replace('Main');
      }
      setSessionChecked(true);
    };

    checkSession();
  }, [navigation]);

  // Toggle between login and signup
  const toggleMode = () => {
    if (isSignUp) {
      setIsSignUp(false);
    } else {
      // Navigate to CreateAccount screen
      navigation.navigate('CreateAccount');
    }
    
    // Reset form fields
    setEmail('');
    setPassword('');
    setFullName('');
  };

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const { data, error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
      return;
    }

    if (data) {
      // Reset navigation to Main screen, removing previous screens from stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  // Handle signup
  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters long');
      return;
    }

    setLoading(true);
    const { session, error } = await signUpWithEmail(email, password, fullName);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    // On successful sign-up
    if (session) {
      // Navigate to ProfileSetup which will then navigate to onboarding flow
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileSetup' }],
      });
    } else {
      // If no session returned but signup was successful
      Alert.alert(
        'Account Created',
        'Your account has been created. You will be directed to profile setup.',
        [{ 
          text: 'OK',
          onPress: () => {
            // Force a navigation reset to ensure proper flow
            navigation.reset({
              index: 0,
              routes: [{ name: 'ProfileSetup' }],
            });
          }
        }]
      );
    }
  };

  if (!sessionChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo/App Name */}
        <View style={styles.headerContainer}>
          <Image 
            source={require('../assets/pooch_necessities_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>Pooch Necessities</Text>
          <Text style={styles.appTagline}>Track, manage, and care for your furry friends</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <FontAwesome5 name="user" size={18} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <FontAwesome5 name="envelope" size={18} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome5 name="lock" size={18} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={isSignUp ? handleSignUp : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.actionButtonText}>
                {isSignUp ? 'Sign Up' : 'Log In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Sign Up / Login */}
          <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  actionButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    padding: 8,
  },
  toggleText: {
    color: '#6B7280',
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
});

export default LoginScreen; 