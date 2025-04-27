import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { FontAwesome5, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = () => {
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pooch Necessities</Text>
        <View style={styles.headerIcons}>
          <FontAwesome5 name="bell" size={20} color="#4B5563" style={styles.icon} />
          <FontAwesome5 name="cog" size={20} color="#4B5563" />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Image 
              source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4448cecd1a-a0473bdbb6739fbad579.png' }} 
              style={styles.profileImage} 
            />
            <View>
              <Text style={styles.greeting}>Good Morning, Sarah!</Text>
              <Text style={styles.dogStatus}>Lucy-Loo is doing great today! 🐾</Text>
            </View>
          </View>
        </View>

        {/* Quick Access Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            {/* Walk Tile */}
            <TouchableOpacity 
              style={styles.quickAccessTile}
              onPress={() => navigation.navigate('AddWalk')}
            >
              <View style={styles.tileIconContainer}>
                <FontAwesome5 name="map-marker-alt" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.tileText}>Walk</Text>
            </TouchableOpacity>
            
            {/* Pee Tile */}
            <TouchableOpacity 
              style={styles.quickAccessTile}
              onPress={() => navigation.navigate('LogActivity', { activityType: 'Pee' })}
            >
              <View style={styles.tileIconContainer}>
                <FontAwesome5 name="tint" size={24} color="#FBBF24" />
              </View>
              <Text style={styles.tileText}>Pee</Text>
            </TouchableOpacity>
            
            {/* Poop Tile */}
            <TouchableOpacity 
              style={styles.quickAccessTile}
              onPress={() => navigation.navigate('LogActivity', { activityType: 'Poop' })}
            >
              <View style={styles.tileIconContainer}>
                <Text style={styles.emojiIcon}>💩</Text>
              </View>
              <Text style={styles.tileText}>Poop</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Recent Activities</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('ActivityLog')}
            >
              <Text style={styles.buttonText}>Log Activity</Text>
            </TouchableOpacity>
          </View>
          
          {/* Activity Cards */}
          <View style={styles.activityList}>
            {/* Morning Walk Card */}
            <TouchableOpacity style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: '#F3E8FF' }]}>
                <Text style={styles.activityEmoji}>🐾</Text>
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Morning Walk</Text>
                <Text style={styles.activityTime}>8:30 AM • 25 mins</Text>
              </View>
            </TouchableOpacity>
            
            {/* Breakfast Card */}
            <TouchableOpacity style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.activityEmoji}>🍳</Text>
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Breakfast</Text>
                <Text style={styles.activityTime}>9:00 AM</Text>
              </View>
            </TouchableOpacity>
            
            {/* Play Time Card */}
            <TouchableOpacity style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.activityEmoji}>🎾</Text>
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Play Time</Text>
                <Text style={styles.activityTime}>10:15 AM • 30 mins</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiInsightCard}
          >
            <View style={styles.aiHeader}>
              <FontAwesome5 name="robot" size={22} color="#FFFFFF" />
              <Text style={styles.aiTitle}>AI Insight</Text>
            </View>
            <Text style={styles.aiText}>
              Lucy-Loo has met her walk goal 5 days in a row! Keep up the great work! 🎉
            </Text>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>View More Insights</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Upcoming Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Activities</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <FontAwesome5 name="chevron-right" size={12} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          <View style={styles.upcomingList}>
            <View style={styles.upcomingCard}>
              <View style={styles.upcomingHeader}>
                <View style={styles.upcomingInfo}>
                  <View style={[styles.iconBg, { backgroundColor: '#FEF3C7' }]}>
                    <FontAwesome5 name="pills" size={16} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.upcomingTitle}>Medicine Time</Text>
                    <Text style={styles.upcomingTime}>Today, 2:30 PM</Text>
                  </View>
                </View>
                <View style={[styles.badgeBg, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.badgeText, { color: '#F59E0B' }]}>In 2h</Text>
                </View>
              </View>
            </View>

            <View style={styles.upcomingCard}>
              <View style={styles.upcomingHeader}>
                <View style={styles.upcomingInfo}>
                  <View style={[styles.iconBg, { backgroundColor: '#D1FAE5' }]}>
                    <FontAwesome5 name="walking" size={16} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.upcomingTitle}>Evening Walk</Text>
                    <Text style={styles.upcomingTime}>Today, 5:00 PM</Text>
                  </View>
                </View>
                <View style={[styles.badgeBg, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.badgeText, { color: '#10B981' }]}>In 4.5h</Text>
                </View>
              </View>
            </View>

            <View style={styles.upcomingCard}>
              <View style={styles.upcomingHeader}>
                <View style={styles.upcomingInfo}>
                  <View style={[styles.iconBg, { backgroundColor: '#DBEAFE' }]}>
                    <FontAwesome5 name="utensils" size={16} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.upcomingTitle}>Dinner Time</Text>
                    <Text style={styles.upcomingTime}>Today, 7:00 PM</Text>
                  </View>
                </View>
                <View style={[styles.badgeBg, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.badgeText, { color: '#3B82F6' }]}>In 6.5h</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Add Dog Profiles Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={{ backgroundColor: '#10b981', padding: 12, marginTop: 8, borderRadius: 8 }}
            onPress={() => navigation.navigate('DogProfiles')}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>View Dog Profiles</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom space to account for footer */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem}>
          <FontAwesome5 name="home" size={20} color="#8B5CF6" />
          <Text style={[styles.footerText, styles.activeFooterText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('ActivityLog')}
        >
          <FontAwesome5 name="calendar-alt" size={20} color="#9CA3AF" />
          <Text style={styles.footerText}>Activities</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => navigation.navigate('DogProfiles')}
        >
          <FontAwesome5 name="paw" size={20} color="#9CA3AF" />
          <Text style={styles.footerText}>Dogs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerItem}>
          <FontAwesome5 name="cog" size={20} color="#9CA3AF" />
          <Text style={styles.footerText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
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
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    marginRight: 16,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
    marginBottom: 4,
  },
  dogStatus: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAccessTile: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  emojiIcon: {
    fontSize: 24,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  activityList: {
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  aiInsightCard: {
    padding: 16,
    borderRadius: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aiTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  aiText: {
    color: 'white',
    marginBottom: 12,
  },
  aiButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  aiButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  upcomingList: {
    gap: 12,
  },
  upcomingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    marginBottom: 12,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  upcomingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upcomingTitle: {
    fontWeight: '600',
    color: '#1F2937',
  },
  upcomingTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  badgeBg: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerText: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
  activeFooterText: {
    color: '#8B5CF6',
  },
});

export default HomeScreen; 