import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { ChartBar as BarChart2, Chrome as Home, ChartPie as PieChart, Settings, Plus } from 'lucide-react-native';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';

export default function TabLayout() {
  const { session, isOnboarded, setIsOnboarded } = useAuthStore();

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      if (!session) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_onboarded')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error checking onboarding status:', error);
          if (Platform.OS !== 'web') {
            Alert.alert('Error', 'Failed to check onboarding status. Please try again.');
          }
          return;
        }

        if (!data || !data.is_onboarded) {
          setIsOnboarded(false);
          router.replace('/onboarding');
        } else {
          setIsOnboarded(true);
        }
      } catch (err) {
        console.error('Error in checkOnboarding:', err);
        if (Platform.OS !== 'web') {
          Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        }
      }
    };

    checkOnboarding();
  }, [session]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4A6FFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <Plus size={24} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <PieChart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#4A6FFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4A6FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});