import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { format } from 'date-fns';

const WalkHistoryScreen = () => {
  const navigation = useNavigation();
  const [walks, setWalks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('walks')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching walks:', error);
        Alert.alert('Error', 'Unable to load walk history');
        return;
      }

      setWalks(data || []);
    } catch (error) {
      console.error('Unexpected error fetching walks:', error);
      Alert.alert('Error', 'Something went wrong while loading walks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalks();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWalks();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDistance = (distanceMeters) => {
    if (!distanceMeters) return '0 km';
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  };

  const renderWalkItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.walkCard}
      onPress={() => navigation.navigate('WalkDetails', { walkId: item.id })}
    >
      <View style={[styles.walkIcon, { backgroundColor: '#F3E8FF' }]}>
        <View>
          <FontAwesome5 name="walking" size={22} color="#8B5CF6" />
        </View>
      </View>
      <View style={styles.walkDetails}>
        <Text style={styles.walkDate}>{formatDate(item.start_time)}</Text>
        <View style={styles.walkStats}>
          <View style={styles.statItem}>
            <View>
              <FontAwesome5 name="route" size={14} color="#6B7280" style={styles.statIcon} />
            </View>
            <Text style={styles.statText}>{formatDistance(item.distance_meters)}</Text>
          </View>
          <View style={styles.statItem}>
            <View>
              <FontAwesome5 name="clock" size={14} color="#6B7280" style={styles.statIcon} />
            </View>
            <Text style={styles.statText}>{item.duration_minutes || 0} mins</Text>
          </View>
        </View>
      </View>
      <View>
        <View>
          <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View>
        <View>
          <FontAwesome5 name="paw" size={50} color="#D1D5DB" />
        </View>
      </View>
      <Text style={styles.emptyText}>No walks recorded yet!</Text>
      <Text style={styles.emptySubtext}>Your walk history will appear here</Text>
      <TouchableOpacity 
        style={styles.addWalkButton}
        onPress={() => navigation.navigate('AddWalk')}
      >
        <Text style={styles.addWalkText}>Record Your First Walk</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View>
            <View>
              <FontAwesome5 name="arrow-left" size={20} color="#4B5563" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Walk History</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchWalks}>
          <View>
            <View>
              <FontAwesome5 name="sync" size={20} color="#4B5563" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading walks...</Text>
        </View>
      ) : (
        <FlatList
          data={walks}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderWalkItem}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={walks.length === 0 ? { flex: 1 } : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8B5CF6']}
            />
          }
        />
      )}
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
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  walkCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  walkIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walkDetails: {
    flex: 1,
  },
  walkDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  walkStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  addWalkButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addWalkText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});

export default WalkHistoryScreen; 