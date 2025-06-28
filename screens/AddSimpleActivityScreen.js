import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { returnAfterActivityCreation } from '../src/utils/activityNavigationHelper';

const AddSimpleActivityScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activityType = 'unknown', returnToTab = false } = route.params || {};
  
  const handleBackPress = () => {
    returnAfterActivityCreation(navigation, returnToTab);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Simple Activity</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.activityTypeText}>
          Activity Type: {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
        </Text>
        <Text style={styles.infoText}>
          This is a placeholder for the AddSimpleActivityScreen component.
        </Text>
        <Text style={styles.infoText}>
          It will be replaced with a fully functional form to add simple activities.
        </Text>
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
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTypeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3B82F6',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    color: '#4B5563',
  }
});

export default AddSimpleActivityScreen; 