import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isOnboarded: boolean;
  isSettingUp: boolean;
  setSession: (session: Session | null) => void;
  setIsOnboarded: (isOnboarded: boolean) => void;
  setIsSettingUp: (isSettingUp: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isOnboarded: false,
  isSettingUp: false,
  setSession: (session) => set({ session }),
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
  setIsSettingUp: (isSettingUp) => set({ isSettingUp }),
}));
