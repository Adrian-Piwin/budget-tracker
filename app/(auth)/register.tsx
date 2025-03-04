import React from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, User } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { globalStyles } from '@/styles/globalStyles';
import { spacing } from '@/styles/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsSettingUp } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setIsSettingUp(true);  // Prevent navigation while we set up

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        try {
          // First, check if profile already exists
          const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select()
            .eq('user_id', data.user.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {  // PGRST116 is "not found" error
            throw checkError;
          }

          let profile;
          if (!existingProfile) {
            // Create new profile
            const { data: profileData, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: data.user.id,
                name: name,
                is_onboarded: false,
              })
              .select()
              .single();

            if (insertError) {
              throw insertError;
            }

            profile = profileData;
          } else {
            profile = existingProfile;
          }

          if (!profile) {
            throw new Error('No user profile available after creation attempt');
          }
        } catch (createError) {
          throw new Error(`Failed to create user profile: ${(createError as Error)?.message || 'Unknown error'}`);
        }
      }

      setIsSettingUp(false);  // Setup complete, allow navigation
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
      if (Platform.OS !== 'web') {
        Alert.alert('Registration Error', error.message || 'Failed to create account. Please try again.');
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
    <View style={globalStyles.authContainer}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.title}>Create Account</Text>
        <Text style={globalStyles.subtitle}>Sign up for a new account</Text>

        {error && <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{error}</Text>
        </View>}

        <View style={globalStyles.inputContainer}>
          <User size={20} color="#666" style={{ marginRight: spacing.sm }} />
          <TextInput
            style={globalStyles.input}
            placeholder="Full Name"
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={globalStyles.inputContainer}>
          <Mail size={20} color="#666" style={{ marginRight: spacing.sm }} />
          <TextInput
            style={globalStyles.input}
            placeholder="Email"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={globalStyles.inputContainer}>
          <Lock size={20} color="#666" style={{ marginRight: spacing.sm }} />
          <TextInput
            style={globalStyles.input}
            placeholder="Password"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[globalStyles.button, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={globalStyles.buttonText}>
            {loading ? 'Creating account...' : 'Create account'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.footer}>
        <Text style={globalStyles.footerText}>Already have an account? </Text>
        <Link href="/login" style={globalStyles.footerLink}>Sign in</Link>
      </View>
    </View>
  );
}
