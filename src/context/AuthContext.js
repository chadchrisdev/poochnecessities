import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../../services/authService';

// Create Auth Context
const AuthContext = createContext({
  user: null,
  profile: null,
  session: null,
  loading: true,
  profileCompleted: false,
  signOut: () => {},
  refreshProfile: () => {},
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    setLoading(true);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state changed: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);

        // When a user signs in or is updated, fetch their profile
        if (session?.user) {
          fetchUserProfile(session.user);
        } else {
          setProfile(null);
          setProfileCompleted(false);
          setLoading(false);
        }
      }
    );

    // Clean up subscription on unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch user profile from the users table
  const fetchUserProfile = async (user) => {
    if (!user) return;

    try {
      const { profile, error } = await getUserProfile();
      if (error) throw error;
      
      setProfile(profile);
      
      // Check if profile has required fields completed
      const isProfileComplete = !!(
        profile && 
        profile.full_name && 
        (profile.avatar_url || profile.avatar_type === 'initial')
      );
      
      setProfileCompleted(isProfileComplete);
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
      setProfileCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile data
  const refreshProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await fetchUserProfile(user);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  // Context value
  const value = {
    user,
    profile,
    session,
    loading,
    profileCompleted,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 