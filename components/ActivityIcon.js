import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getActivityIcon } from '../constants/activityIcons';

/**
 * A reusable component to display activity icons consistently across the app
 */
const ActivityIcon = ({ 
  activityType, 
  size = 22, 
  containerSize = 50,
  containerStyle,
  iconStyle
}) => {
  const iconConfig = getActivityIcon(activityType);
  const IconComponent = iconConfig.component;
  
  const dynamicStyles = {
    container: {
      width: containerSize,
      height: containerSize,
      borderRadius: containerSize / 2,
      backgroundColor: iconConfig.bgColor,
    },
    icon: {
      fontSize: size,
    }
  };
  
  return (
    <View style={[styles.container, dynamicStyles.container, containerStyle]}>
      <IconComponent 
        name={iconConfig.name} 
        size={size} 
        color={iconConfig.color} 
        style={iconStyle} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActivityIcon; 