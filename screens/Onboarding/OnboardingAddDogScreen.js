import React, { useState, useEffect } from 'react';
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
  ScrollView,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { pickAndUploadImage } from '../../src/utils/pickAndUploadAvatar';
import uuid from 'react-native-uuid';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import BreedSelector from '../../src/components/BreedSelector';

const OnboardingAddDogScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthdayDate, setBirthdayDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For the picked image file
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dogImage, setDogImage] = useState(null); // For UI display
  const [dogsAdded, setDogsAdded] = useState([]);
  const [fetchingDogs, setFetchingDogs] = useState(true);
  const [showDogForm, setShowDogForm] = useState(true); // Track whether to show the dog form

  // Ensure we have the current user
  useEffect(() => {
    const getUser = async () => {
      if (!currentUser) {
        try {
          const { data, error } = await supabase.auth.getUser();
          if (error) {
            console.error('Error getting user:', error);
          } else if (data?.user) {
            setCurrentUser(data.user);
          }
        } catch (error) {
          console.error('Error in getUser:', error);
        }
      }
    };

    getUser();
    
    // Check if photo_url column exists in dogs table
    checkDogTableColumns();
  }, [currentUser]);

  // Fetch dogs when the component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      console.log('Current user in OnboardingAddDogScreen:', currentUser);
      fetchUserDogs();
    }
  }, [currentUser]);

  // Update to show form based on dogs added
  useEffect(() => {
    // If dogs are added, hide the form initially
    if (dogsAdded.length > 0) {
      setShowDogForm(false);
    } else {
      setShowDogForm(true);
    }
  }, [dogsAdded.length]);

  // Function to fetch all dogs for the current user
  const fetchUserDogs = async () => {
    if (!currentUser) return;
    
    try {
      setFetchingDogs(true);
      
      console.log('Fetching dogs for user:', currentUser.id);
      
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error details:', JSON.stringify(error));
        
        // If the error is about the column not existing, try fetching all dogs
        if (error.code === '42703' && error.message.includes('user_id')) {
          console.warn('user_id column not found, fetching all dogs');
          
          // Let's check the table structure
          console.log('Checking dogs table structure...');
          const { data: columnInfo, error: columnError } = await supabase
            .rpc('get_table_info', { tablename: 'dogs' });
            
          if (columnError) {
            console.error('Error checking table structure:', columnError);
          } else {
            console.log('Dogs table columns:', columnInfo);
          }
          
          const { data: allDogs, error: allDogsError } = await supabase
            .from('dogs')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (allDogsError) {
            console.error('Error fetching all dogs:', allDogsError);
            setDogsAdded([]);
          } else {
            console.log('Successfully fetched all dogs:', allDogs?.length || 0);
            setDogsAdded(allDogs || []);
          }
        } else {
          console.error('Error fetching dogs:', error);
          setDogsAdded([]);
        }
      } else {
        console.log('Successfully fetched dogs for user:', data?.length || 0);
        setDogsAdded(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching dogs:', error);
      setDogsAdded([]);
    } finally {
      setFetchingDogs(false);
    }
  };

  // Function to pick an image from the gallery (but not upload yet)
  const handlePickDogImage = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to pick images');
      return;
    }

    try {
      // Request permission and pick a new image
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }
      
      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduce quality for smaller file size
      });

      if (result.canceled) {
        console.log('Image picking cancelled');
        return;
      }
      
      const selectedAsset = result.assets[0];
      // Store the picked image asset in state (without uploading)
      setSelectedImage(selectedAsset);
      // Set the image for UI display
      setDogImage({ uri: selectedAsset.uri });
      
      console.log('Image picked and ready for upload after dog is saved');
      
    } catch (error) {
      console.error('Unexpected error picking image:', error);
      Alert.alert('Error', 'Something went wrong with the image selection');
    }
  };

  // Function to upload image after dog is saved
  const uploadDogImage = async (dogId) => {
    if (!selectedImage || !currentUser || !dogId) {
      console.log('Missing required info for image upload:', {
        hasSelectedImage: !!selectedImage,
        hasCurrentUser: !!currentUser,
        dogId
      });
      return null;
    }
    
    try {
      setUploadingImage(true);
      console.log('Starting image upload for dog:', dogId);
      console.log('Selected image:', selectedImage.uri);
      
      // Debug log to check the parameters
      console.log('Upload parameters:', {
        entityId: dogId, // Use dogId as the entityId for proper identification
        bucketName: 'avatars',
        pathPrefix: `${currentUser.id}/dogs`,
        hasExistingImage: !!selectedImage
      });
      
      const { imageUrl, error } = await pickAndUploadImage({
        entityId: dogId, // Use dogId as the entityId for proper identification
        bucketName: 'avatars',
        pathPrefix: `${currentUser.id}/dogs`,
        aspectRatio: [1, 1],
        existingImage: selectedImage,
      });

      if (error) {
        console.error('Error uploading dog image:', error);
        return null;
      }

      console.log('Image uploaded successfully, URL:', imageUrl);
      return imageUrl;
      
    } catch (error) {
      console.error('Unexpected error uploading dog image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const saveDog = async () => {
    // Validate required fields
    if (!dogName.trim()) {
      Alert.alert("Error", "Please enter a dog name");
      return;
    }

    if (!breed.trim()) {
      Alert.alert("Error", "Please select a breed");
      return;
    }

    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to add a dog");
      return;
    }

    try {
      setLoading(true);

      // Create dog object with required fields (no image_url yet)
      const dogData = { 
        name: dogName.trim(),
        breed: breed.trim(),
        birthday: birthday || null,
        created_at: new Date().toISOString(),
        user_id: currentUser.id, // Include user_id in the insert
      };

      const { data, error } = await supabase
        .from('dogs')
        .insert([dogData])
        .select();

      if (error) {
        // If the error is about the user_id column not existing, try without it
        if (error.code === '42703' && error.message.includes('user_id')) {
          console.warn('user_id column not found, trying without it');
          const { name, breed, birthday, created_at } = dogData;
          
          // Try again without user_id
          const insertData = { name, breed, birthday, created_at };
          
          const { data: retryData, error: retryError } = await supabase
            .from('dogs')
            .insert([insertData])
            .select();
            
          if (retryError) {
            console.error('Error saving dog (retry):', retryError);
            Alert.alert("Error", "Failed to save dog profile");
            return;
          }
          
          // Success with retry - now try to upload image if we have one
          let savedDog = retryData[0];
          let imageUrl = null;
          
          // Upload the image now that we have a dog ID
          if (selectedImage) {
            console.log('About to upload image for newly saved dog (retry case), ID:', savedDog.id);
            imageUrl = await uploadDogImage(savedDog.id);
            console.log('Image upload result (retry case):', imageUrl ? 'Success' : 'Failed');
            
            // Add image URL to the local state entry even if we couldn't save it to DB
            if (imageUrl) {
              console.log('Adding image URL to dog object in local state');
              savedDog = { ...savedDog, photo_url: imageUrl };
              
              // Try to update the DB record with the photo_url anyway
              try {
                console.log('Attempting to update dog record with photo_url (retry case)');
                const { data: updatedData, error: photoUpdateError } = await supabase
                  .from('dogs')
                  .update({ photo_url: imageUrl })
                  .eq('id', savedDog.id)
                  .select();
                
                console.log('Update photo attempt result:', photoUpdateError ? 'Failed' : 'Success');
                if (photoUpdateError) {
                  console.warn('Could not update dog with photo_url in database, but using in local state');
                }
              } catch (photoUpdateError) {
                console.error('Exception updating dog with photo_url (retry case):', photoUpdateError);
              }
            } else {
              console.log('No image URL received after upload (retry case)');
            }
          } else {
            console.log('No selected image to upload for the dog (retry case)');
          }
          
          setDogsAdded([savedDog, ...dogsAdded]);
          
          // Reset form fields and image
          resetForm();
          
          // Show success message
          Alert.alert(
            "Success", 
            `${savedDog.name} has been added successfully!`,
            [{ 
              text: "OK",
              onPress: () => {
                console.log('Dog added success acknowledged, continuing...');
                // Delay slightly to ensure state updates complete
                setTimeout(() => {
                  console.log('Resetting form after dog add');
                  resetForm();
                }, 100);
              }
            }]
          );
        } else {
          console.error('Error saving dog:', error);
          Alert.alert("Error", "Failed to save dog profile");
        }
        return;
      }
      
      // Success on first try - now upload image if we have one
      let savedDog = data[0];
      let imageUrl = null;
      
      // Upload the image now that we have a dog ID
      if (selectedImage) {
        console.log('About to upload image for newly saved dog ID:', savedDog.id);
        imageUrl = await uploadDogImage(savedDog.id);
        console.log('Image upload result:', imageUrl ? 'Success' : 'Failed');
        
        // If we have an image URL, try to update the dog with it
        if (imageUrl) {
          try {
            console.log('Updating dog record with photo_url:', imageUrl);
            console.log('Dog ID being updated:', savedDog.id);
            
            const { data: updatedData, error: updateError } = await supabase
              .from('dogs')
              .update({ photo_url: imageUrl })
              .eq('id', savedDog.id)
              .select();
              
            // Log full response for debugging
            console.log('Update response:', { updatedData, error: updateError });
            
            // If update worked, add the image URL to the saved dog
            if (!updateError) {
              console.log('Dog updated with photo_url successfully');
              savedDog = { ...savedDog, photo_url: imageUrl };
            } else if (updateError.code === 'PGRST204' || updateError.message.includes('photo_url')) {
              // Just use the image URL in local state but don't persist to DB
              console.warn('photo_url column not found, not persisting image URL');
              savedDog = { ...savedDog, photo_url: imageUrl };
            } else {
              console.error('Other error updating dog with photo_url:', updateError);
              // Still use the image URL in local state
              savedDog = { ...savedDog, photo_url: imageUrl };
            }
          } catch (updateError) {
            console.error('Exception during dog update with photo_url:', updateError);
            // Still use the image URL in local state
            savedDog = { ...savedDog, photo_url: imageUrl };
          }
        } else {
          console.log('No image URL received after upload, skipping dog update');
        }
      } else {
        console.log('No selected image to upload for the dog');
      }
      
      setDogsAdded([savedDog, ...dogsAdded]);
      
      // Reset form fields and image
      resetForm();
      
      // Show success message
      Alert.alert(
        "Success", 
        `${savedDog.name} has been added successfully!`,
        [{ 
          text: "OK",
          onPress: () => {
            console.log('Dog added success acknowledged, continuing...');
            // Delay slightly to ensure state updates complete
            setTimeout(() => {
              console.log('Resetting form after dog add');
              resetForm();
            }, 100);
          }
        }]
      );
      
    } catch (error) {
      console.error('Unexpected error saving dog:', error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to reset the form
  const resetForm = () => {
    setDogName('');
    setBreed('');
    setBirthday('');
    setBirthdayDate(new Date());
    setDogImage(null);
    setSelectedImage(null);
    // Hide the form if dogs have been added
    if (dogsAdded.length > 0) {
      setShowDogForm(false);
    }
  };

  const handleContinue = () => {
    if (dogsAdded.length === 0) {
      Alert.alert(
        "No Dogs Added", 
        "You haven't added any dogs yet. Do you want to continue without adding a dog?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Continue Anyway", 
            onPress: () => navigation.navigate('OnboardingAddress')
          }
        ]
      );
    } else {
      navigation.navigate('OnboardingAddress');
    }
  };

  // Render the dog image
  const renderDogImage = () => {
    if (uploadingImage) {
      return (
        <View style={styles.dogImagePlaceholder}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      );
    } else if (dogImage) {
      return (
        <Image source={dogImage} style={styles.dogImage} />
      );
    } else {
      return (
        <View style={styles.dogImagePlaceholder}>
          <FontAwesome5 name="dog" size={36} color="#8B5CF6" />
        </View>
      );
    }
  };

  // Function to check if the dogs table has the photo_url column
  const checkDogTableColumns = async () => {
    try {
      console.log('Checking dogs table structure...');
      // Attempt to get a dog with photo_url column
      const { data, error } = await supabase
        .from('dogs')
        .select('photo_url')
        .limit(1);
        
      if (error && (error.code === 'PGRST204' || error.message.includes('photo_url'))) {
        console.warn('The dogs table does not have a photo_url column');
        console.log('Recommend adding one with: ALTER TABLE dogs ADD COLUMN photo_url TEXT;');
      } else {
        console.log('The dogs table has a photo_url column');
      }
    } catch (error) {
      console.error('Error checking dogs table structure:', error);
    }
  };

  // Function to toggle dog form visibility
  const toggleDogForm = () => {
    setShowDogForm(!showDogForm);
  };

  // Format date to display a more readable format
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Create date object and adjust for timezone issues
      const dateParts = dateString.split('-');
      if (dateParts.length !== 3) return dateString;
      
      // Create date at noon to avoid timezone issues
      const date = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        12, 0, 0
      );
      
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format date to YYYY-MM-DD for database storage
  const formatDateForDB = (date) => {
    // Set time to noon to avoid timezone issues
    const adjustedDate = new Date(date);
    adjustedDate.setHours(12, 0, 0, 0);
    return format(adjustedDate, 'yyyy-MM-dd');
  };

  // Show date picker
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  // Hide date picker
  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  // Handle date picker confirmation
  const handleConfirmDate = (selectedDate) => {
    hideDatePicker();
    
    // Set time to noon to avoid timezone issues
    const adjustedDate = new Date(selectedDate);
    adjustedDate.setHours(12, 0, 0, 0);
    
    setBirthdayDate(adjustedDate);
    const formattedDate = formatDateForDB(adjustedDate);
    setBirthday(formattedDate);
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
        <Text style={styles.headerTitle}>Add Your Dog</Text>
        <View style={{ width: 20 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.formContainer}>
          {fetchingDogs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading your dogs...</Text>
            </View>
          ) : dogsAdded.length > 0 && (
            <View style={styles.dogsAddedContainer}>
              <Text style={styles.dogsAddedTitle}>Your Dogs:</Text>
              {dogsAdded.map((dog) => (
                <View key={dog.id} style={styles.dogItem}>
                  {dog.photo_url ? (
                    <Image 
                      source={{ uri: dog.photo_url }} 
                      style={styles.dogItemImage} 
                    />
                  ) : (
                    <FontAwesome5 name="dog" size={16} color="#8B5CF6" style={styles.dogItemIcon} />
                  )}
                  <Text style={styles.dogItemText}>
                    {dog.name} 
                    {dog.breed ? ` • ${dog.breed}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Dog form - only show if showDogForm is true */}
          {showDogForm && (
            <>
              <View style={styles.dogProfile}>
                <TouchableOpacity 
                  style={styles.imageContainer}
                  onPress={handlePickDogImage}
                  disabled={uploadingImage}
                >
                  {renderDogImage()}
                  <View style={styles.cameraIcon}>
                    <FontAwesome5 name="camera" size={14} color="white" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.photoNote}>
                  {dogImage ? 'Tap to change photo' : 'Tap to add a photo (optional)'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dog Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your dog's name"
                  value={dogName}
                  onChangeText={setDogName}
                  autoCapitalize="words"
                />
              </View>

              <BreedSelector 
                value={breed}
                onChange={setBreed}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Birthday</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={showDatePicker}
                >
                  <Text style={styles.datePickerButtonText}>
                    {birthday ? formatDateForDisplay(birthday) : 'Select Birthday'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Only show the Save Dog button here when dogs have been added */}
              {dogsAdded.length > 0 && (
                <TouchableOpacity 
                  style={[styles.saveButton, (!dogName.trim() || !breed.trim()) && styles.saveButtonDisabled]}
                  onPress={saveDog}
                  disabled={!dogName.trim() || !breed.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Dog</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
          
          {/* Actions container - always visible but with different options based on dogsAdded */}
          <View style={styles.actionsContainer}>
            {dogsAdded.length > 0 ? (
              // If dogs have been added, show Add Another Dog and Continue
              <>
                <TouchableOpacity 
                  style={styles.addAnotherButton}
                  onPress={showDogForm ? saveDog : toggleDogForm}
                  disabled={showDogForm && (!dogName.trim() || !breed.trim() || loading)}
                >
                  <FontAwesome5 name="plus" size={14} color="#8B5CF6" style={{ marginRight: 8 }} />
                  <Text style={styles.addAnotherText}>
                    {showDogForm ? 'Add Another Dog' : 'Add A Dog'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={handleContinue}
                >
                  <Text style={styles.continueText}>Continue</Text>
                  <FontAwesome5 name="arrow-right" size={14} color="#8B5CF6" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </>
            ) : (
              // If no dogs added, just show Save Dog
              <TouchableOpacity 
                style={[styles.fullWidthButton, (!dogName.trim() || !breed.trim()) && styles.saveButtonDisabled]}
                onPress={saveDog}
                disabled={!dogName.trim() || !breed.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Dog</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={birthdayDate}
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
      />
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8B5CF6',
  },
  dogsAddedContainer: {
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  dogsAddedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  dogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dogItemIcon: {
    marginRight: 8,
  },
  dogItemImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  dogItemText: {
    fontSize: 14,
    color: '#4B5563',
  },
  dogProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  dogImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dogImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 4,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 0,
    backgroundColor: '#8B5CF6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  photoNote: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
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
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  addAnotherText: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  continueText: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  fullWidthButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    width: '100%',
  },
  datePickerButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  datePickerButtonText: {
    color: '#4B5563',
    fontSize: 16,
  },
});

export default OnboardingAddDogScreen; 