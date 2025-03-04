import React from 'react';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { session, setSession, isSettingUp } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Error getting session:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Always render both stacks, but only one will be accessible
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="(auth)" 
          options={{ animation: 'none' }} 
          redirect={!isLoading && !isSettingUp && !!session}
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ animation: 'fade' }} 
          redirect={!isLoading && !isSettingUp && !session}
        />
        <Stack.Screen 
          name="onboarding" 
          options={{ animation: 'fade' }} 
          redirect={!isLoading && !isSettingUp && !session}
        />
        <Stack.Screen 
          name="categories" 
          options={{ animation: 'slide_from_right' }} 
          redirect={!isLoading && !isSettingUp && !session}
        />
        <Stack.Screen 
          name="recurring" 
          options={{ animation: 'slide_from_right' }} 
          redirect={!isLoading && !isSettingUp && !session}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
