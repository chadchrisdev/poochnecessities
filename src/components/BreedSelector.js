import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  Keyboard
} from 'react-native';
import { DOG_BREEDS, formatBreedString, parseBreedString } from '../utils/dogBreeds';

const BreedSelector = ({ value, onChange, style }) => {
  // Parse the initial breed value
  const parsedBreed = parseBreedString(value);
  
  // Local state for breed selection
  const [breedType, setBreedType] = useState(parsedBreed.breedType);
  const [primaryBreed, setPrimaryBreed] = useState(parsedBreed.primaryBreed);
  const [secondaryBreed, setSecondaryBreed] = useState(parsedBreed.secondaryBreed);
  
  // Modal visibility state
  const [primaryModalVisible, setPrimaryModalVisible] = useState(false);
  const [secondaryModalVisible, setSecondaryModalVisible] = useState(false);
  
  // Search state
  const [primarySearch, setPrimarySearch] = useState('');
  const [secondarySearch, setSecondarySearch] = useState('');
  
  // Refs for text inputs
  const primarySearchRef = useRef(null);
  const secondarySearchRef = useRef(null);
  
  // Filtered breeds based on search
  const filteredPrimaryBreeds = DOG_BREEDS.filter(breed => 
    breed.toLowerCase().includes(primarySearch.toLowerCase())
  );
  
  const filteredSecondaryBreeds = DOG_BREEDS.filter(breed => 
    breed.toLowerCase().includes(secondarySearch.toLowerCase())
  );
  
  // Update parent component when breed selection changes
  useEffect(() => {
    const breedString = formatBreedString(breedType, primaryBreed, secondaryBreed);
    onChange(breedString);
  }, [breedType, primaryBreed, secondaryBreed]);
  
  // Handle breed type selection
  const selectBreedType = (type) => {
    setBreedType(type);
    if (type === 'pure' && !primaryBreed) {
      // If switching to pure breed and no primary breed is selected, reset secondary breed
      setSecondaryBreed('');
    }
  };
  
  // Handle breed selection in a single tap
  const handleBreedSelection = (breed, setBreed, setModalVisible, setSearch, inputRef) => {
    requestAnimationFrame(() => {
      setBreed(breed);
      Keyboard.dismiss();
      setSearch('');
      setModalVisible(false);
    });
  };
  
  // Render breed picker modal
  const renderBreedPickerModal = (
    visible, 
    setVisible, 
    search, 
    setSearch, 
    filteredBreeds, 
    selectedBreed, 
    setSelectedBreed,
    title,
    inputRef
  ) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        setVisible(false);
        setSearch('');
        Keyboard.dismiss();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity 
              onPress={() => {
                setVisible(false);
                setSearch('');
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search breeds..."
            value={search}
            onChangeText={setSearch}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={() => {
              // If there's exactly one result, select it
              if (filteredBreeds.length === 1) {
                handleBreedSelection(
                  filteredBreeds[0], 
                  setSelectedBreed, 
                  setVisible, 
                  setSearch,
                  inputRef
                );
              }
            }}
          />
          
          <FlatList
            data={filteredBreeds}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.breedItem,
                  selectedBreed === item && styles.selectedBreedItem
                ]}
                onPress={() => handleBreedSelection(
                  item, 
                  setSelectedBreed, 
                  setVisible, 
                  setSearch,
                  inputRef
                )}
              >
                <Text style={[
                  styles.breedItemText,
                  selectedBreed === item && styles.selectedBreedItemText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.breedList}
          />
        </View>
      </View>
    </Modal>
  );
  
  return (
    <View style={[styles.container, style]}>
      {/* Breed Type Selector */}
      <View style={styles.breedTypeContainer}>
        <Text style={styles.label}>Breed Type</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentedButton,
              breedType === 'pure' && styles.segmentedButtonActive,
              { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
            ]}
            onPress={() => selectBreedType('pure')}
          >
            <Text style={[
              styles.segmentedButtonText,
              breedType === 'pure' && styles.segmentedButtonTextActive
            ]}>
              Pure Breed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentedButton,
              breedType === 'mixed' && styles.segmentedButtonActive,
              { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
            ]}
            onPress={() => selectBreedType('mixed')}
          >
            <Text style={[
              styles.segmentedButtonText,
              breedType === 'mixed' && styles.segmentedButtonTextActive
            ]}>
              Mixed Breed
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Breed Selection Section */}
      <View style={styles.breedSelectionContainer}>
        {breedType === 'pure' ? (
          <View style={styles.breedInputGroup}>
            <Text style={styles.label}>Breed</Text>
            <TouchableOpacity 
              style={styles.breedButton}
              onPress={() => {
                setPrimaryModalVisible(true);
                // Focus the search input when modal opens
                setTimeout(() => {
                  if (primarySearchRef.current) {
                    primarySearchRef.current.focus();
                  }
                }, 100);
              }}
            >
              <Text style={[
                styles.breedButtonText,
                !primaryBreed && styles.breedButtonPlaceholder
              ]}>
                {primaryBreed || 'Select Breed'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.breedInputGroup}>
              <Text style={styles.label}>Primary Breed</Text>
              <TouchableOpacity 
                style={styles.breedButton}
                onPress={() => {
                  setPrimaryModalVisible(true);
                  // Focus the search input when modal opens
                  setTimeout(() => {
                    if (primarySearchRef.current) {
                      primarySearchRef.current.focus();
                    }
                  }, 100);
                }}
              >
                <Text style={[
                  styles.breedButtonText,
                  !primaryBreed && styles.breedButtonPlaceholder
                ]}>
                  {primaryBreed || 'Select Primary Breed'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.breedInputGroup}>
              <Text style={styles.label}>Secondary Breed (Optional)</Text>
              <TouchableOpacity 
                style={styles.breedButton}
                onPress={() => {
                  setSecondaryModalVisible(true);
                  // Focus the search input when modal opens
                  setTimeout(() => {
                    if (secondarySearchRef.current) {
                      secondarySearchRef.current.focus();
                    }
                  }, 100);
                }}
              >
                <Text style={[
                  styles.breedButtonText,
                  !secondaryBreed && styles.breedButtonPlaceholder
                ]}>
                  {secondaryBreed || 'Select Secondary Breed'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      
      {/* Preview of the final breed string */}
      {(primaryBreed || secondaryBreed) && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Selected Breed:</Text>
          <Text style={styles.previewValue}>
            {formatBreedString(breedType, primaryBreed, secondaryBreed)}
          </Text>
        </View>
      )}
      
      {/* Breed Selection Modals */}
      {renderBreedPickerModal(
        primaryModalVisible,
        setPrimaryModalVisible,
        primarySearch,
        setPrimarySearch,
        filteredPrimaryBreeds,
        primaryBreed,
        setPrimaryBreed,
        breedType === 'pure' ? 'Select Breed' : 'Select Primary Breed',
        primarySearchRef
      )}
      
      {renderBreedPickerModal(
        secondaryModalVisible,
        setSecondaryModalVisible,
        secondarySearch,
        setSecondarySearch,
        filteredSecondaryBreeds,
        secondaryBreed,
        setSecondaryBreed,
        'Select Secondary Breed',
        secondarySearchRef
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  breedTypeContainer: {
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  segmentedButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  segmentedButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  segmentedButtonText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  segmentedButtonTextActive: {
    color: 'white',
  },
  breedSelectionContainer: {
    marginBottom: 8,
  },
  breedInputGroup: {
    marginBottom: 16,
  },
  breedButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breedButtonText: {
    color: '#4B5563',
  },
  breedButtonPlaceholder: {
    color: '#9CA3AF',
  },
  previewContainer: {
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '500',
  },
  searchInput: {
    margin: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breedList: {
    maxHeight: '70%',
  },
  breedItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedBreedItem: {
    backgroundColor: '#F3E8FF',
  },
  breedItemText: {
    fontSize: 16,
    color: '#4B5563',
  },
  selectedBreedItemText: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
});

export default BreedSelector; 