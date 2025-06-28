import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../src/lib/supabase';

const DogProfileScreen = () => {
  const navigation = useNavigation();
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Track if screen is currently focused
  const isFocused = useRef(false);
  // Track last time dogs were fetched
  const lastFetchTime = useRef(0);

  const fetchDogs = async (force = false) => {
    // Skip fetch if we just did one (within last 2 seconds) unless forced
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 2000) {
      console.log('Skipping dog fetch - too soon since last fetch');
      return;
    }
    
    lastFetchTime.current = now;
    
    try {
      if (!refreshing) {
        setLoading(true);
      }
      console.log('Fetching dogs...');
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, birthday, photo_url, user_id, created_at')
        .order('name');

      if (error) {
        console.error('Error fetching dogs:', error);
        Alert.alert('Error', 'Unable to load dog profiles');
        return;
      }

      console.log('Dogs fetched successfully:', data);
      
      // Fix common issues with image URLs
      if (data && data.length > 0) {
        // Process dogs that have potentially problematic image URLs
        const dogsToFix = data.filter(dog => {
          // Check for dogs with image URLs that might be file:// protocol or other local paths
          const hasLocalUrl = dog.photo_url && (
            dog.photo_url.startsWith('file:///') || 
            dog.photo_url.startsWith('/') ||
            dog.photo_url.startsWith('content://') ||
            !dog.photo_url.includes('://') // Not a proper URL at all
          );
          
          return hasLocalUrl;
        });
        
        console.log(`Found ${dogsToFix.length} dogs with potentially problematic image URLs`);
        
        // Log details of problematic dogs for debugging
        if (dogsToFix.length > 0) {
          dogsToFix.forEach(dog => {
            console.log(`Problematic dog image: Dog ID ${dog.id}, Name: ${dog.name}`);
            console.log(`  photo_url: ${dog.photo_url || 'null'}`);
          });
        }
      }
      
      // Check if any dogs have image URLs
      const dogsWithImages = data.filter(dog => dog.photo_url);
      console.log(`Found ${dogsWithImages.length} dogs with images out of ${data.length} total dogs`);
      
      // Log the image URLs for debugging
      dogsWithImages.forEach(dog => {
        console.log(`Dog "${dog.name}" image URL:`, dog.photo_url);
      });

      setDogs(data || []);
    } catch (error) {
      console.error('Unexpected error fetching dogs:', error);
      Alert.alert('Error', 'Something went wrong while loading dogs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch dogs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('DogProfileScreen focused, fetching dogs...');
      isFocused.current = true;
      
      // Force refresh when returning to this screen
      fetchDogs(true);
      
      return () => {
        console.log('DogProfileScreen unfocused');
        isFocused.current = false;
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDogs(true); // Force refresh when pull-to-refresh is used
  }, []);
  
  // Calculate dog's age in years and months
  const calculateDogAge = (birthday) => {
    if (!birthday) return null;
    
    try {
      // Parse the birthday string (expected format: YYYY-MM-DD)
      const parts = birthday.split('-');
      if (parts.length !== 3) return null;
      
      // Create date at noon to avoid timezone issues
      const birthDate = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
        12, 0, 0
      );
      
      const today = new Date();
      
      // Calculate difference in milliseconds
      const diffTime = today - birthDate;
      if (diffTime < 0) return null; // Future birthdate
      
      // Calculate years
      const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
      
      // Calculate remaining months after subtracting years
      const remainingMs = diffTime - (years * 1000 * 60 * 60 * 24 * 365.25);
      const months = Math.floor(remainingMs / (1000 * 60 * 60 * 24 * 30.4375));
      
      // Format the age string
      if (years === 0) {
        if (months === 0) return 'Less than 1 month';
        return `${months} month${months !== 1 ? 's' : ''}`;
      } else if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
      }
    } catch (error) {
      console.error('Error calculating dog age:', error);
      return null;
    }
  };
  
  // Render dog image without cache-busting tokens
  const renderDogImage = (dog) => {
    const imageUrl = dog.photo_url;
    
    if (!imageUrl) {
      console.log(`Dog ${dog.name} (ID: ${dog.id}) has no image URL`);
      return (
        <View style={styles.dogImagePlaceholder}>
          <FontAwesome5 name="dog" size={28} color="#8B5CF6" />
        </View>
      );
    }
    
    console.log(`Rendering image for dog ${dog.name}: ${imageUrl}`);
    
    return (
      <Image 
        source={{ uri: imageUrl }}
        style={styles.dogImage}
        resizeMode="cover"
        onError={(e) => {
          console.error(`Failed to load image for dog ${dog.name}:`, e.nativeEvent.error);
        }}
        onLoad={() => console.log(`Image loaded successfully for dog ${dog.name}`)}
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dog Profiles</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddDog')}>
          <FontAwesome5 name="plus" size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading dogs...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8B5CF6']}
            />
          }
        >
          {dogs.length > 0 ? (
            dogs.map(dog => (
              <TouchableOpacity 
                key={dog.id} 
                style={styles.dogCard}
                onPress={() => navigation.navigate('DogDetails', { dog })}
              >
                {renderDogImage(dog)}
                <View style={styles.dogInfo}>
                  <Text style={styles.dogName}>{dog.name}</Text>
                  <Text style={styles.dogBreed}>
                    {dog.breed || 'Breed not specified'}
                  </Text>
                  {dog.birthday && (
                    <View>
                      <Text style={styles.dogBirthday}>
                        Birthday: {dog.birthday}
                      </Text>
                      <Text style={styles.dogAge}>
                        Age: {calculateDogAge(dog.birthday) || 'Unknown'}
                      </Text>
                    </View>
                  )}
                </View>
                <FontAwesome5 name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noDogText}>No dogs added yet</Text>
          )}
          
          {/* Add New Dog Card */}
          <TouchableOpacity 
            style={styles.addDogCard}
            onPress={() => navigation.navigate('AddDog')}
          >
            <View style={styles.addDogCircle}>
              <FontAwesome5 name="plus" size={24} color="white" />
            </View>
            <Text style={styles.addDogText}>Add a New Dog</Text>
          </TouchableOpacity>
          
          {/* Bottom padding to prevent content from being cut off by tab bar */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
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
    paddingVertical: 16,
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  dogCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dogImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dogImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  dogBreed: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  dogBirthday: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  dogAge: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  dogStats: {
    flexDirection: 'row',
  },
  statItem: {
    marginRight: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  addDogCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    height: 100,
  },
  addDogCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addDogText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  noDogText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 20,
    marginBottom: 20,
  }
});

export default DogProfileScreen; 