# Activity Icons Guide

This document provides guidance on using the standardized activity icons system across the Pooch Necessities app.

## Overview

We've centralized our activity icon system to ensure consistency across all screens in the app. This means that any activity type (like walks, feeding, medication, etc.) will have the same icon, color, and background color everywhere it appears.

## Using Activity Icons in Components

### The ActivityIcon Component

The easiest way to display activity icons is to use the `ActivityIcon` component:

```jsx
import ActivityIcon from '../components/ActivityIcon';

// In your render method:
<ActivityIcon 
  activityType="walk" 
  size={22} 
  containerSize={50}
/>
```

#### Props

- `activityType`: The type of activity (e.g., "walk", "feed", "pee", etc.)
- `size`: Size of the icon (default: 22)
- `containerSize`: Size of the container circle (default: 50)
- `containerStyle`: Additional styles for the container
- `iconStyle`: Additional styles for the icon

### Using the Utility Functions

If you need more flexibility, you can use the utility functions directly:

```jsx
import { getActivityIcon, getActivityTitle } from '../constants/activityIcons';

// Get icon configuration
const iconConfig = getActivityIcon('walk');
// iconConfig = { component: FontAwesome5, name: 'walking', color: '#8B5CF6', bgColor: '#F3E8FF' }

// Use in your own custom component
const IconComponent = iconConfig.component;
<IconComponent 
  name={iconConfig.name} 
  size={24} 
  color={iconConfig.color} 
/>

// Get display title for an activity
const title = getActivityTitle('walk'); // "Walk"
```

## Supported Activity Types

| Activity Type | Icon | Display Name |
|---------------|------|--------------|
| walk | walking | Walk |
| pee | tint | Pee |
| poop | poop | Poop |
| feeding/feed | utensils | Feeding |
| medication/meds | pills | Medication |
| vet | heart | Vet Visit |
| play | baseball-ball | Play Time |
| default | paw | Activity |

## Adding New Activity Types

To add a new activity type:

1. Open `constants/activityIcons.js`
2. Add a new entry to the `ACTIVITY_ICONS` object
3. Update the `getActivityTitle` function if needed

Example:

```js
// Add a new activity type
grooming: { 
  component: FontAwesome5, 
  name: 'cut', 
  color: '#9333EA',
  bgColor: '#F5F3FF' 
},

// Then in getActivityTitle:
case 'grooming':
  return 'Grooming Session';
```

## Benefits

- **Consistency**: All activity icons look the same across the app
- **Maintainability**: Change an icon once, it updates everywhere
- **Simplicity**: Reduces duplicate code across components
- **Flexibility**: Easy to add new activity types or modify existing ones 