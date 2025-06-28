import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Central mapping of activity types to their respective icons and colors.
 * Used across the app to ensure consistency in activity representation.
 */
export const ACTIVITY_ICONS = {
  // Walking/Exercise activities
  walk: { 
    component: FontAwesome5, 
    name: 'walking', 
    color: '#3B82F6', // blue
    bgColor: '#3B82F620' // blue with 20% opacity
  },
  
  // Bathroom activities
  pee: { 
    component: FontAwesome5, 
    name: 'tint', 
    color: '#FBBF24', // yellow
    bgColor: '#FBBF2420' 
  },
  poop: { 
    component: FontAwesome5, 
    name: 'poop', 
    color: '#92400E', // brown
    bgColor: '#92400E20' 
  },
  
  // Food related activities
  feeding: { 
    component: FontAwesome5, 
    name: 'bone', 
    color: '#F97316', // orange
    bgColor: '#F9731620' 
  },
  feed: { 
    component: FontAwesome5, 
    name: 'bone', 
    color: '#F97316', // orange
    bgColor: '#F9731620' 
  },
  
  // Water
  water: {
    component: FontAwesome5,
    name: 'tint',
    color: '#0EA5E9', // light blue
    bgColor: '#0EA5E920'
  },
  
  // Medical activities
  medication: { 
    component: FontAwesome5, 
    name: 'pills', 
    color: '#EF4444', // red
    bgColor: '#EF444420' 
  },
  meds: { 
    component: FontAwesome5, 
    name: 'pills', 
    color: '#EF4444', // red
    bgColor: '#EF444420' 
  },
  
  // Grooming
  grooming: {
    component: FontAwesome5,
    name: 'cut',
    color: '#EC4899', // pink
    bgColor: '#EC489920'
  },
  
  // Vet
  vet: { 
    component: FontAwesome5, 
    name: 'stethoscope', 
    color: '#10B981', // green
    bgColor: '#10B98120' 
  },
  
  // Training
  training: {
    component: FontAwesome5,
    name: 'graduation-cap',
    color: '#6366F1', // indigo
    bgColor: '#6366F120'
  },
  
  // Play activities
  play: { 
    component: FontAwesome5, 
    name: 'baseball-ball', 
    color: '#8B5CF6', // purple
    bgColor: '#8B5CF620' 
  },
  
  // Vomit
  vomit: {
    component: FontAwesome5,
    name: 'exclamation-triangle',
    color: '#F59E0B', // amber
    bgColor: '#F59E0B20'
  },
  
  // Custom activity
  custom: {
    component: FontAwesome5,
    name: 'plus',
    color: '#6B7280', // gray
    bgColor: '#6B728020'
  },
  
  // Default activity
  default: { 
    component: FontAwesome5, 
    name: 'paw', 
    color: '#6B7280', // gray
    bgColor: '#6B728020' 
  }
};

/**
 * Get activity icon configuration for a given activity type
 * @param {string} activityType - Type of activity
 * @returns {Object} Icon configuration
 */
export const getActivityIcon = (activityType) => {
  if (!activityType) return ACTIVITY_ICONS.default;
  
  const type = activityType.toLowerCase();
  return ACTIVITY_ICONS[type] || ACTIVITY_ICONS.default;
};

/**
 * Get a friendly display title for an activity type
 * @param {string} activityType - Type of activity
 * @returns {string} Readable activity title
 */
export const getActivityTitle = (activityType) => {
  if (!activityType) return 'Activity';
  
  const type = activityType.toLowerCase();
  
  switch (type) {
    case 'walk':
      return 'Walk';
    case 'pee':
      return 'Pee';
    case 'poop':
      return 'Poop';
    case 'feeding':
    case 'feed':
      return 'Feeding';
    case 'water':
      return 'Water';
    case 'medication':
    case 'meds':
      return 'Medication';
    case 'grooming':
      return 'Grooming';
    case 'vet':
      return 'Vet Visit';
    case 'training':
      return 'Training';
    case 'play':
      return 'Playtime';
    case 'vomit':
      return 'Vomit';
    case 'custom':
      return 'Custom Activity';
    default:
      // Capitalize the first letter
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}; 