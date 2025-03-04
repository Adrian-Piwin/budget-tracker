import { supabase } from '@/lib/supabase';

export class UserService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getUserProfile() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserProfile(profileData: any) {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', this.userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({ user_id: this.userId, ...profileData })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
}