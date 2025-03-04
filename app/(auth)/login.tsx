import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Lock, Mail } from 'lucide-react-native';
import React from 'react';
import { UserService } from '@/services/UserService';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsSettingUp } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    setIsSettingUp(true);  // Prevent navigation while we set up

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user profile exists and create if it doesn't
      if (data.user) {
        const userService = new UserService(data.user.id);
        let profile;
        
        try {
          profile = await userService.getUserProfile();
        } catch (error) {
          try {
            // First, check if profile already exists
            const { data: existingProfile, error: checkError } = await supabase
              .from('user_profiles')
              .select()
              .eq('user_id', data.user.id)
              .single();

            if (checkError && checkError.code !== 'PGRST116') {  // PGRST116 is "not found" error
              console.error('Error checking existing profile:', checkError);
              throw checkError;
            }

            if (!existingProfile) {
              // Create new profile
              const { data: profileData, error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: data.user.id,
                  name: data.user.email?.split('@')[0] || 'User',
                  is_onboarded: false,
                })
                .select()
                .single();

              if (insertError) {
                console.error('Insert error details:', insertError);
                throw insertError;
              }

              profile = profileData;
            } else {
              profile = existingProfile;
            }
          } catch (createError: unknown) {
            console.error('Failed to create profile. Error details:', createError);
            throw new Error(`Failed to create user profile: ${(createError as Error)?.message || 'Unknown error'}`);
          }
        }

        if (!profile) {
          throw new Error('No user profile available after creation attempt');
        }
      }
      
      setIsSettingUp(false);  // Setup complete, allow navigation
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
      if (Platform.OS !== 'web') {
        Alert.alert('Login Error', error.message || 'Failed to sign in. Please check your credentials and try again.');
      }
      // Sign out the user if profile creation failed
      if (error.message.includes('Failed to create user profile') || error.message === 'No user profile available after creation attempt') {
        await supabase.auth.signOut();
      }
      setIsSettingUp(false);  // Allow navigation again after error
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Budget Tracker</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {error && <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>}

        <View style={styles.inputContainer}>
          <Mail size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4A6FFF',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#4A6FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
});
