import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  StatusBar,
  Platform,
  useWindowDimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { navigateToActivityCreate } from '../src/utils/activityNavigationHelper';

const ActivityCard = ({ activityType, title, description, iconName, color, onPress }) => {
  // Extract the hex color without opacity
  const baseColor = color;
  // Create a lighter background color for the icon
  const bgColor = color + '20'; // 20% opacity
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
          <FontAwesome5 name={iconName} size={16} color={baseColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const AddActivityScreen = () => {
  const navigation = useNavigation();
  const { height } = useWindowDimensions();
  
  // Calculate if we need to make cards even smaller for smaller screens
  const isSmallScreen = height < 700;
  
  const handleActivitySelect = (activityType) => {
    // Navigate to the appropriate create activity screen using the navigation helper
    navigateToActivityCreate(navigation, activityType);
  };
  
  const activityTypes = [
    {
      id: 'walk',
      title: 'Walk',
      description: 'Track duration and route',
      iconName: 'walking',
      color: '#3B82F6', // blue
    },
    {
      id: 'pee',
      title: 'Pee',
      description: 'Quick timestamp',
      iconName: 'tint',
      color: '#FBBF24', // yellow
    },
    {
      id: 'poop',
      title: 'Poop',
      description: 'Quick timestamp',
      iconName: 'poop',
      color: '#92400E', // brown
    },
    {
      id: 'feeding',
      title: 'Feeding',
      description: 'Food and quantity',
      iconName: 'bone',
      color: '#F97316', // orange
    },
    {
      id: 'water',
      title: 'Water',
      description: 'Track water intake',
      iconName: 'tint',
      color: '#0EA5E9', // light blue
    },
    {
      id: 'medication',
      title: 'Medication',
      description: 'Track medicine intake',
      iconName: 'pills',
      color: '#EF4444', // red
    },
    {
      id: 'grooming',
      title: 'Grooming',
      description: 'Bath, trim, nails',
      iconName: 'cut',
      color: '#EC4899', // pink
    },
    {
      id: 'vet',
      title: 'Vet Visit',
      description: 'Medical checkups',
      iconName: 'stethoscope',
      color: '#10B981', // green
    },
    {
      id: 'training',
      title: 'Training',
      description: 'Track progress',
      iconName: 'graduation-cap',
      color: '#6366F1', // indigo
    },
    {
      id: 'play',
      title: 'Playtime',
      description: 'Fun activities',
      iconName: 'baseball-ball',
      color: '#8B5CF6', // purple
    },
    {
      id: 'vomit',
      title: 'Vomit',
      description: 'Track when sick',
      iconName: 'exclamation-triangle', 
      color: '#F59E0B', // amber
    },
    {
      id: 'custom',
      title: 'Custom',
      description: 'Add new activity',
      iconName: 'plus',
      color: '#6B7280', // gray
    },
  ];
  
  const renderItem = ({ item }) => (
    <ActivityCard
      activityType={item.id}
      title={item.title}
      description={item.description}
      iconName={item.iconName}
      color={item.color}
      onPress={() => handleActivitySelect(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <SafeAreaView style={styles.safeContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Activity</Text>
        </View>
        
        {/* Activity Grid */}
        <FlatList
          data={activityTypes}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.gridContainer,
            { paddingBottom: Platform.OS === 'ios' ? 75 : 85 } // Adjusted padding for tab bar
          ]}
          contentInsetAdjustmentBehavior="automatic"
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  gridContainer: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginHorizontal: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 8,
    paddingVertical: 10,
    marginTop: 8,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 78, // Reduced height to eliminate empty space
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: '100%', // Make the content fill the available height
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
  },
  cardTitle: {
    fontSize: 14, // Further reduced font size
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 10, // Further reduced font size
    color: '#6B7280',
    lineHeight: 14, // Add line height to make text more compact
  }
});

export default AddActivityScreen; 