import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { UserService } from '@/services/UserService';
import { BudgetService } from '@/services/BudgetService';
import { Bell, CreditCard, DollarSign, CircleHelp as HelpCircle, LogOut, Moon, Pencil, Shield, User as UserIcon } from 'lucide-react-native';

export default function SettingsScreen() {
  const { session, setSession } = useAuthStore();
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!session) return;

      try {
        const userService = new UserService(session.user.id);
        const profile = await userService.getUserProfile();
        setUser(profile);
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };

    loadUserProfile();
  }, [session]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to sign out');
      }
    }
  };

  const handleManageCategories = () => {
    router.push('/categories');
  };

  const handleManageRecurringExpenses = () => {
    router.push('/recurring');
  };

  const confirmSignOut = () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', onPress: handleSignOut, style: 'destructive' },
        ]
      );
    } else {
      handleSignOut();
    }
  };

  const renderSettingItem = (icon, title, onPress = null, rightElement = null) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIconContainer}>{icon}</View>
      <Text style={styles.settingText}>{title}</Text>
      <View style={styles.settingRight}>{rightElement}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileInitial}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{session?.user?.email || ''}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Pencil size={20} color="#4A6FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Budget Management</Text>
        <View style={styles.settingsGroup}>
          {renderSettingItem(
            <DollarSign size={20} color="#4A6FFF" />,
            'Manage Categories',
            handleManageCategories
          )}
          {renderSettingItem(
            <CreditCard size={20} color="#4A6FFF" />,
            'Recurring Expenses',
            handleManageRecurringExpenses
          )}
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsGroup}>
          {renderSettingItem(
            <Moon size={20} color="#4A6FFF" />,
            'Dark Mode',
            () => setDarkMode(!darkMode),
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#e0e0e0', true: '#b3c4ff' }}
              thumbColor={darkMode ? '#4A6FFF' : '#f4f3f4'}
            />
          )}
          {renderSettingItem(
            <Bell size={20} color="#4A6FFF" />,
            'Notifications',
            () => setNotifications(!notifications),
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e0e0e0', true: '#b3c4ff' }}
              thumbColor={notifications ? '#4A6FFF' : '#f4f3f4'}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsGroup}>
          {renderSettingItem(
            <UserIcon size={20} color="#4A6FFF" />,
            'Account Information'
          )}
          {renderSettingItem(
            <Shield size={20} color="#4A6FFF" />,
            'Privacy & Security'
          )}
          {renderSettingItem(
            <HelpCircle size={20} color="#4A6FFF" />,
            'Help & Support'
          )}
          {renderSettingItem(
            <LogOut size={20} color="#FF3B30" />,
            'Sign Out',
            confirmSignOut
          )}
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A6FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  settingsGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingRight: {
    marginLeft: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
});