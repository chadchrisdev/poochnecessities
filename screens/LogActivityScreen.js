import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

const LogActivityScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { activityType } = route.params;
  const [notes, setNotes] = useState('');

  // Activity type icons mapping
  const getActivityIcon = () => {
    switch(activityType) {
      case 'Walk':
        return <FontAwesome5 name="map-marker-alt" size={24} color="#8B5CF6" />;
      case 'Pee':
        return <FontAwesome5 name="tint" size={24} color="#FBBF24" />;
      case 'Poop':
        return <Text style={styles.emojiIcon}>💩</Text>;
      default:
        return <FontAwesome5 name="paw" size={24} color="#8B5CF6" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log {activityType}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.content}>
        {/* Activity Type Section */}
        <View style={styles.activityTypeSection}>
          <View style={styles.activityIconContainer}>
            {getActivityIcon()}
          </View>
          <Text style={styles.activityTypeText}>{activityType}</Text>
        </View>

        {/* Notes Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            placeholder="Add any notes about this activity..."
            value={notes}
            onChangeText={setNotes}
            style={styles.textInput}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            // For now, just navigate back to HomeScreen
            navigation.navigate('Home');
          }}
        >
          <Text style={styles.saveButtonText}>Save Activity</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activityTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityTypeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
  },
  emojiIcon: {
    fontSize: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LogActivityScreen; 