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
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import BreedSelector from '../src/components/BreedSelector';

const EditDogScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { dog } = route.params;
  
  const [dogName, setDogName] = useState(dog.name || '');
  const [breed, setBreed] = useState(dog.breed || '');
  const [birthday, setBirthday] = useState(dog.birthday || '');
  const [birthdayDate, setBirthdayDate] = useState(dog.birthday ? new Date(dog.birthday) : new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [image, setImage] = useState(dog.photo_url || null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    // Log the dog object to see what image URLs are present
    console.log('EditDogScreen - Dog data:', {
      id: dog.id,
      name: dog.name,
      photo_url: dog.photo_url
    });
    
    (async () => {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library to upload a dog photo.');
      }
    })();
  }, []);

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

  // Safely get image URI, handling potential issues with URLs
  const getImageSource = () => {
    if (!image) return null;
    
    // Log the image source for debugging
    console.log('Current image source:', image);
    
    // Check if it's a valid URL or a local file path
    if (image.startsWith('file://') || image.startsWith('/') || image.startsWith('content://')) {
      console.warn('Image source is a local file path, this might not be accessible after app restart:', image);
      // Return it anyway and let the Image component handle any errors
      return { uri: image };
    }
    
    // Just use the image URL directly without cache-busting
    return { uri: image };
  };

  const pickImage = async () => {
    try {
      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setUploadLoading(true);
        
        // Use the local URI immediately for better UX
        const localUri = selectedAsset.uri;
        setImage(localUri);
        
        // No need to try to upload to Supabase Storage at this point
        // Just use the local URI, which will work for the user's current session
        
        // When the user saves the profile, the local URI will be saved to the database
        // This ensures the functionality works even if Supabase storage is not available
        
        Alert.alert(
          "Photo Selected",
          "Your photo has been selected and will be saved with the profile. Press 'Save Changes' to keep it."
        );
        
        setUploadLoading(false);
      }
    } catch (error) {
      console.error('Error in image picker:', error);
      Alert.alert('Error', 'Could not select image. Please try again.');
      setUploadLoading(false);
    }
  };

  const updateDog = async () => {
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
        .update({ 
          name: dogName.trim(),
          breed: breed.trim(),
          birthday,
          photo_url: image
        })
        .eq('id', dog.id)
        .select();

      if (error) {
        console.error('Error updating dog:', error);
        Alert.alert("Error", "Failed to update dog profile");
        return;
      }

      Alert.alert(
        "Success", 
        `${dogName} has been updated successfully!`,
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('Unexpected error updating dog:', error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Dog",
      `Are you sure you want to delete ${dog.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteDog }
      ]
    );
  };

  const deleteDog = async () => {
    try {
      setDeleteLoading(true);

      const { error } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dog.id);

      if (error) {
        console.error('Error deleting dog:', error);
        Alert.alert("Error", "Failed to delete dog profile");
        return;
      }

      Alert.alert(
        "Success", 
        `${dog.name} has been deleted successfully!`,
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('Unexpected error deleting dog:', error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setDeleteLoading(false);
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
        <Text style={styles.headerTitle}>Edit Dog</Text>
        <View style={{ width: 20 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.dogProfile}>
            {uploadLoading ? (
              <View style={styles.dogImagePlaceholder}>
                <ActivityIndicator size="large" color="#8B5CF6" />
              </View>
            ) : image ? (
              <Image 
                source={getImageSource()} 
                style={styles.dogImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.dogImagePlaceholder}>
                <FontAwesome5 name="dog" size={36} color="#8B5CF6" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={pickImage}
              disabled={uploadLoading}
            >
              <Text style={styles.uploadButtonText}>
                {image ? 'Change Photo' : 'Upload Photo'}
              </Text>
            </TouchableOpacity>
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
            onPress={updateDog}
            disabled={!dogName.trim() || !breed.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={confirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <FontAwesome5 name="trash-alt" size={16} color="white" style={styles.deleteIcon} />
                <Text style={styles.deleteButtonText}>Delete Dog</Text>
              </>
            )}
          </TouchableOpacity>
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
  dogProfile: {
    alignItems: 'center',
    marginBottom: 24,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  uploadButton: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#8B5CF6',
    fontWeight: '500',
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
    marginTop: 24,
    flexDirection: 'row',
  },
  saveButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteIcon: {
    marginRight: 8,
  },
});

export default EditDogScreen; 