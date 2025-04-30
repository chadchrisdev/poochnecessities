import React, { useState } from 'react';
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
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { pickAndUploadImage } from '../src/utils/pickAndUploadAvatar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import BreedSelector from '../src/components/BreedSelector';

const AddDogScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthdayDate, setBirthdayDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For the picked image file
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dogImage, setDogImage] = useState(null); // For UI display

  // Format date to YYYY-MM-DD for database storage
  const formatDateForDB = (date) => {
    // Set time to noon to avoid timezone issues
    const adjustedDate = new Date(date);
    adjustedDate.setHours(12, 0, 0, 0);
    return format(adjustedDate, 'yyyy-MM-dd');
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

  // Show date picker
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  // Hide date picker
  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  // Handle confirm from date picker
  const handleConfirm = (selectedDate) => {
    hideDatePicker();
    
    // Set time to noon to avoid timezone issues
    const adjustedDate = new Date(selectedDate);
    adjustedDate.setHours(12, 0, 0, 0);
    
    setBirthdayDate(adjustedDate);
    const formattedDate = formatDateForDB(adjustedDate);
    setBirthday(formattedDate);
  };

  // Function to pick an image from the gallery (but not upload yet)
  const handlePickDogImage = async () => {
    if (!user) {
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
    if (!selectedImage || !user || !dogId) {
      console.log('Missing required info for image upload:', {
        hasSelectedImage: !!selectedImage,
        hasUser: !!user,
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
        pathPrefix: `${user.id}/dogs`,
        hasExistingImage: !!selectedImage
      });
      
      const { imageUrl, error } = await pickAndUploadImage({
        entityId: dogId, // Use dogId as the entityId for proper identification
        bucketName: 'avatars',
        pathPrefix: `${user.id}/dogs`,
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

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('dogs')
        .insert([{ 
          name: dogName.trim(),
          breed: breed.trim(),
          birthday: birthday || null,
          // photo_url will be added after upload if image is selected
        }])
        .select();

      if (error) {
        console.error('Error saving dog:', error);
        Alert.alert("Error", "Failed to save dog profile");
        return;
      }

      // Success - now upload image if we have one
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
            
            // If update worked, use the updated data
            if (!updateError && updatedData) {
              console.log('Dog updated with photo_url successfully');
              savedDog = updatedData[0];
            } else if (updateError) {
              console.error('Error updating dog with photo_url:', updateError);
            }
          } catch (updateError) {
            console.error('Exception during dog update with photo_url:', updateError);
          }
        }
      }

      Alert.alert(
        "Success", 
        `${dogName} has been added successfully!`,
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('Unexpected error saving dog:', error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Add Dog</Text>
        <View style={{ width: 20 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.dogProfile}>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={handlePickDogImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <View style={styles.dogImagePlaceholder}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
              ) : dogImage ? (
                <Image source={dogImage} style={styles.dogImage} />
              ) : (
                <View style={styles.dogImagePlaceholder}>
                  <FontAwesome5 name="dog" size={36} color="#8B5CF6" />
                </View>
              )}
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
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={birthdayDate}
        onConfirm={handleConfirm}
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
  dogProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dogImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dogImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 2,
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
});

export default AddDogScreen; 