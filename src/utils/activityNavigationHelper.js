import { Platform } from 'react-native';

/**
 * Maps activity types to their corresponding detail and edit screen names
 */
const activityScreenMap = {
  walk: {
    detail: 'WalkDetail',
    edit: 'EditWalk',
    create: 'AddWalk'
  },
  feeding: {
    detail: 'FeedingDetail',
    edit: 'EditFeeding',
    create: 'AddFeeding'
  },
  medication: {
    detail: 'MedicationDetail',
    edit: 'EditMedication',
    create: 'AddMedication'
  },
  water: {
    detail: 'SimpleDetail',
    edit: 'SimpleEdit',
    create: 'AddSimpleActivity'
  },
  grooming: {
    detail: 'SimpleDetail',
    edit: 'SimpleEdit',
    create: 'AddSimpleActivity'
  },
  pee: {
    detail: 'SimpleDetail',
    edit: 'SimpleEdit',
    create: 'AddSimpleActivity'
  },
  poop: {
    detail: 'SimpleDetail',
    edit: 'SimpleEdit',
    create: 'AddSimpleActivity'
  },
  vomit: {
    detail: 'SimpleDetail',
    edit: 'SimpleEdit',
    create: 'AddSimpleActivity'
  },
  play: {
    detail: 'SimpleDetail',
    edit: 'SimpleEdit',
    create: 'AddSimpleActivity'
  },
  vet: {
    detail: 'SimpleDetail', 
    edit: 'SimpleEdit',
    create: 'AddSimpleActivity'
  },
  training: {
    detail: 'SimpleDetail',
    edit: 'SimpleEdit',
    create: 'AddSimpleActivity'
  },
  custom: {
    detail: 'SimpleDetail',
    edit: 'SimpleEdit',
    create: 'AddCustomActivity'
  }
};

/**
 * Get the correct detail screen name based on activity type
 * 
 * @param {string} activityType - The type of activity
 * @returns {string} The screen name to navigate to
 */
export const getDetailScreenForActivityType = (activityType) => {
  if (!activityType) return 'ActivityDetail';
  
  const type = activityType.toLowerCase();
  return activityScreenMap[type]?.detail || 'ActivityDetail';
};

/**
 * Get the correct edit screen name based on activity type
 * 
 * @param {string} activityType - The type of activity
 * @returns {string} The screen name to navigate to
 */
export const getEditScreenForActivityType = (activityType) => {
  if (!activityType) return 'EditActivity';
  
  const type = activityType.toLowerCase();
  return activityScreenMap[type]?.edit || 'EditActivity';
};

/**
 * Get the correct create screen name based on activity type
 * 
 * @param {string} activityType - The type of activity
 * @returns {string} The screen name to navigate to
 */
export const getCreateScreenForActivityType = (activityType) => {
  if (!activityType) return 'AddActivity';
  
  const type = activityType.toLowerCase();
  return activityScreenMap[type]?.create || 'AddSimpleActivity';
};

/**
 * Navigate to the appropriate detail screen based on activity type
 * 
 * @param {object} navigation - The navigation object
 * @param {string} activityId - The ID of the activity
 * @param {string} activityType - The type of activity
 */
export const navigateToActivityDetail = (navigation, activityId, activityType) => {
  const screenName = getDetailScreenForActivityType(activityType);
  navigation.navigate(screenName, { 
    activityId,
    activityType 
  });
};

/**
 * Navigate to the appropriate edit screen based on activity type
 * 
 * @param {object} navigation - The navigation object
 * @param {string} activityId - The ID of the activity
 * @param {string} activityType - The type of activity
 */
export const navigateToActivityEdit = (navigation, activityId, activityType) => {
  const screenName = getEditScreenForActivityType(activityType);
  navigation.navigate(screenName, { 
    activityId,
    activityType 
  });
};

/**
 * Navigate to the appropriate create screen based on activity type
 * 
 * @param {object} navigation - The navigation object
 * @param {string} activityType - The type of activity
 * @param {object} params - Additional parameters to pass to the screen
 */
export const navigateToActivityCreate = (navigation, activityType, params = {}) => {
  const screenName = getCreateScreenForActivityType(activityType);
  
  // Pass the returnToTab parameter to let the creation screen know to return to the tab navigator
  navigation.navigate(screenName, { 
    activityType,
    returnToTab: true,
    ...params
  });
};

/**
 * Handle returning to the appropriate screen after activity creation
 * 
 * @param {object} navigation - The navigation object
 * @param {boolean} returnToTab - Whether to return to the tab navigator
 */
export const returnAfterActivityCreation = (navigation, returnToTab = false) => {
  if (returnToTab) {
    // Return to the main tab navigator and switch to the Activities tab
    navigation.navigate('Main', { screen: 'ActivitiesTab' });
  } else {
    // Just go back
    navigation.goBack();
  }
}; 