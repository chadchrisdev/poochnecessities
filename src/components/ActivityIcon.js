import React from 'react';
import { View } from 'react-native';
import { getActivityIcon } from '../../constants/activityIcons';

/**
 * A utility component that renders activity icons using the central icon configuration
 */
const ActivityIcon = ({ type, size = 24, containerStyle }) => {
  const iconConfig = getActivityIcon(type);
  const { component: IconComponent, name, color } = iconConfig;
  
  return (
    <IconComponent name={name} size={size} color={color} />
  );
};

export default ActivityIcon; 