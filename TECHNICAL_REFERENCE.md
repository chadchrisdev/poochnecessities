# Pooch Necessities - Technical Reference

## Quick Start Guide

### Environment Setup
1. Clone the repository
2. Create `.env` file with Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```
3. Install dependencies: `npm install`
4. Start development: `npm start`

## Key Code Patterns

### Activity Icon Usage
```javascript
import ActivityIcon from '../src/components/ActivityIcon';
import { getActivityIcon, getActivityTitle } from '../constants/activityIcons';

// Using the component
<ActivityIcon 
  activityType="walk" 
  size={24} 
  showBackground={true}
/>

// Getting icon configuration
const iconConfig = getActivityIcon('feeding');
const title = getActivityTitle('medication');
```

### Navigation Patterns
```javascript
import { navigateToActivityDetail, navigateToActivityEdit } from '../src/utils/activityNavigationHelper';

// Navigate to activity detail (type-specific)
const handleActivityPress = (activity) => {
  navigateToActivityDetail(navigation, activity.id, activity.activity_type);
};

// Navigate to activity edit
const handleEditPress = (activity) => {
  navigateToActivityEdit(navigation, activity.id, activity.activity_type);
};
```

### Supabase Data Fetching
```javascript
import { supabase } from '../src/lib/supabase';

// Fetch activities with dog information
const fetchActivities = async () => {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      dogs(id, name, photo_url)
    `)
    .order('start_time', { ascending: false });
    
  if (error) throw error;
  return data;
};

// Fetch user's dogs
const fetchUserDogs = async (userId) => {
  const { data, error } = await supabase
    .from('dogs')
    .select('*')
    .eq('user_id', userId)
    .order('name');
    
  return { data, error };
};
```

### Authentication Context Usage
```javascript
import { useAuth } from '../src/context/AuthContext';

const MyComponent = () => {
  const { user, profile, loading, profileCompleted, signOut } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;
  
  return (
    <View>
      <Text>Welcome, {profile?.full_name}</Text>
      {!profileCompleted && <ProfileSetupPrompt />}
    </View>
  );
};
```

## Database Queries

### Common Activity Queries
```sql
-- Get today's activities for a user
SELECT a.*, d.name as dog_name, d.photo_url as dog_photo
FROM activities a
LEFT JOIN dogs d ON a.dog_id = d.id
WHERE a.user_id = $1 
  AND a.start_time >= CURRENT_DATE
ORDER BY a.start_time DESC;

-- Get activity statistics
SELECT 
  activity_type,
  COUNT(*) as count,
  AVG(duration_minutes) as avg_duration
FROM activities 
WHERE user_id = $1 
  AND start_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY activity_type;

-- Get walk statistics
SELECT 
  COUNT(*) as total_walks,
  SUM(distance_meters) as total_distance,
  AVG(duration_minutes) as avg_duration
FROM walks 
WHERE user_id = $1 
  AND start_time >= CURRENT_DATE - INTERVAL '30 days';
```

### RLS Policy Examples
```sql
-- Activities table policies
CREATE POLICY "Users can view their own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id);
```

## Component Implementation Patterns

### Screen Structure Template
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

const MyScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data logic here
      const { data, error } = await supabase
        .from('table_name')
        .select('*');
        
      if (error) throw error;
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen content */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    margin: 20,
  },
});

export default MyScreen;
```

### Reusable Card Component Pattern
```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ActivityIcon from './ActivityIcon';

const ActivityCard = ({ activity, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <ActivityIcon 
          activityType={activity.activity_type} 
          size={24} 
          showBackground={true} 
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.subtitle}>{activity.dog_name}</Text>
        </View>
      </View>
      <Text style={styles.time}>
        {formatTime(activity.start_time)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
```

## API Service Layer Pattern

### Service Implementation
```javascript
// services/activityService.js
import { supabase } from '../src/lib/supabase';

export const activityService = {
  // Get all activities for user
  async getUserActivities(userId, limit = 50) {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        dogs(id, name, photo_url)
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit);
      
    return { data, error };
  },

  // Create new activity
  async createActivity(activityData) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select()
      .single();
      
    return { data, error };
  },

  // Update activity
  async updateActivity(activityId, updates) {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', activityId)
      .select()
      .single();
      
    return { data, error };
  },

  // Delete activity
  async deleteActivity(activityId) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);
      
    return { error };
  },

  // Get activities by type
  async getActivitiesByType(userId, activityType, dateRange = null) {
    let query = supabase
      .from('activities')
      .select(`
        *,
        dogs(id, name, photo_url)
      `)
      .eq('user_id', userId)
      .eq('activity_type', activityType);
      
    if (dateRange) {
      query = query
        .gte('start_time', dateRange.start)
        .lte('start_time', dateRange.end);
    }
    
    const { data, error } = await query
      .order('start_time', { ascending: false });
      
    return { data, error };
  }
};
```

## Utility Functions

### Date Formatting
```javascript
import { format, parseISO, isToday, isYesterday } from 'date-fns';

export const formatActivityTime = (timestamp) => {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, h:mm a');
  }
};

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
};

export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters}m`;
  } else {
    const km = (meters / 1000).toFixed(1);
    return `${km}km`;
  }
};
```

### Form Validation
```javascript
export const validateActivityForm = (formData) => {
  const errors = {};
  
  if (!formData.activity_type) {
    errors.activity_type = 'Activity type is required';
  }
  
  if (!formData.start_time) {
    errors.start_time = 'Start time is required';
  }
  
  if (!formData.dog_id) {
    errors.dog_id = 'Please select a dog';
  }
  
  if (formData.activity_type === 'walk') {
    if (!formData.duration_minutes || formData.duration_minutes <= 0) {
      errors.duration_minutes = 'Duration must be greater than 0';
    }
    
    if (!formData.distance_meters || formData.distance_meters <= 0) {
      errors.distance_meters = 'Distance must be greater than 0';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

## Testing Patterns

### Component Testing Template
```javascript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ActivityCard from '../components/ActivityCard';

describe('ActivityCard', () => {
  const mockActivity = {
    id: '1',
    activity_type: 'walk',
    title: 'Morning Walk',
    dog_name: 'Buddy',
    start_time: '2023-12-01T09:00:00Z',
  };

  it('renders activity information correctly', () => {
    const { getByText } = render(
      <ActivityCard activity={mockActivity} onPress={() => {}} />
    );
    
    expect(getByText('Morning Walk')).toBeTruthy();
    expect(getByText('Buddy')).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ActivityCard 
        activity={mockActivity} 
        onPress={mockOnPress}
        testID="activity-card"
      />
    );
    
    fireEvent.press(getByTestId('activity-card'));
    expect(mockOnPress).toHaveBeenCalledWith(mockActivity);
  });
});
```

## Performance Optimization

### FlatList Optimization
```javascript
import React, { useCallback } from 'react';
import { FlatList } from 'react-native';

const ActivityList = ({ activities, onActivityPress }) => {
  const renderActivity = useCallback(({ item }) => (
    <ActivityCard 
      activity={item} 
      onPress={() => onActivityPress(item)}
    />
  ), [onActivityPress]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <FlatList
      data={activities}
      renderItem={renderActivity}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      getItemLayout={(data, index) => ({
        length: 80, // Estimated item height
        offset: 80 * index,
        index,
      })}
    />
  );
};
```

### Image Optimization
```javascript
import { Image } from 'react-native';

const OptimizedImage = ({ source, style, ...props }) => (
  <Image
    source={source}
    style={style}
    resizeMode="cover"
    fadeDuration={200}
    {...props}
  />
);
```

## Common Issues & Solutions

### 1. Supabase Connection Issues
```javascript
// Check connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    console.log('Supabase connected successfully');
  } catch (error) {
    console.error('Supabase connection failed:', error);
  }
};
```

### 2. Navigation State Issues
```javascript
// Reset navigation stack
const resetToHome = () => {
  navigation.reset({
    index: 0,
    routes: [{ name: 'Main' }],
  });
};

// Navigate with proper state cleanup
const navigateWithCleanup = (screenName, params) => {
  // Clear any pending state
  setLoading(false);
  setError(null);
  
  navigation.navigate(screenName, params);
};
```

### 3. Memory Leaks Prevention
```javascript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    try {
      const result = await apiCall();
      if (isMounted) {
        setData(result);
      }
    } catch (error) {
      if (isMounted) {
        setError(error);
      }
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, []);
```

## Deployment Scripts

### Build Commands
```bash
# Development build
expo start

# Production build for app stores
expo build:android
expo build:ios

# Web deployment
expo build:web

# Update over-the-air
expo publish
```

### Environment Configuration
```javascript
// app.config.js
export default {
  expo: {
    name: process.env.NODE_ENV === 'production' ? 'Pooch Necessities' : 'Pooch Necessities Dev',
    slug: 'pooch-necessities',
    version: '1.0.0',
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};
```

---

*This technical reference complements the main project handoff documentation with specific implementation details and code examples.* 