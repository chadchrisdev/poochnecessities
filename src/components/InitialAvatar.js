import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Colors for avatar backgrounds - same as in createInitialAvatar.js
const AVATAR_COLORS = [
  '#4C6BF5', // Blue
  '#4CAF50', // Green
  '#9C27B0', // Purple
  '#FF5722', // Orange
  '#2196F3', // Light Blue
  '#E91E63'  // Pink
];

/**
 * A component that renders a circle with the user's initial
 * This is more reliable than trying to use SVG or image URIs
 */
const InitialAvatar = ({ name, size = 120, style }) => {
  // Default to question mark if no name
  if (!name || typeof name !== 'string' || !name.trim()) {
    name = '?';
  }
  
  // Get first initial
  const initial = name.trim().charAt(0).toUpperCase();
  
  // Generate a consistent color based on the initial
  const colorIndex = initial.charCodeAt(0) % AVATAR_COLORS.length;
  const backgroundColor = AVATAR_COLORS[colorIndex];
  
  // Calculate font size based on avatar size
  const fontSize = Math.floor(size * 0.5);
  
  return (
    <View 
      style={[
        styles.container,
        { 
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor
        },
        style
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  initial: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default InitialAvatar; 