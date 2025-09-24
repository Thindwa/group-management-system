import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Create admin client with service role key
const supabaseAdmin = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

// Regular client for profile operations
import { supabase } from './supabase';

// Admin service for user management
export class AdminService {
  // Create a new user with auth and profile
  static async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    role: string;
    group_id: string;
  }) {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin service not configured. Please add EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
      }

      // Step 1: Check if email already exists by trying to create the user first
      // We'll let the auth creation handle the duplicate email check

      // Step 2: Create auth user using Supabase Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
        }
      });

      if (authError) {
        // Check if it's a duplicate email error
        if (authError.message.includes('duplicate') || authError.message.includes('already exists')) {
          throw new Error(`User with email ${userData.email} already exists`);
        }
        throw new Error(`Auth creation failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create auth user');
      }

      // Step 3: Check if profile already exists (created by trigger)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      let profileData;
      
      if (existingProfile) {
        // Profile already exists (created by trigger), update it
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role,
            group_id: userData.group_id,
          })
          .eq('id', authData.user.id)
          .select()
          .single();

        if (updateError) {
          // If update fails, clean up auth user
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Profile update failed: ${updateError.message}`);
        }
        
        profileData = updatedProfile;
      } else {
        // Profile doesn't exist, create it
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role,
            group_id: userData.group_id,
          })
          .select()
          .single();

        if (profileError) {
          // If profile creation fails, clean up auth user
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        
        profileData = newProfile;
      }

      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
          group_id: userData.group_id,
        },
        credentials: {
          email: userData.email,
          password: userData.password,
        }
      };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update user profile
  static async updateUser(userId: string, updates: {
    full_name?: string;
    phone?: string;
    email?: string;
    role?: string;
  }) {
    try {
      console.log('AdminService.updateUser called with:', { userId, updates });
      
      if (!supabaseAdmin) {
        throw new Error('Admin service not configured. Please add EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
      }

      // Prepare profile update data (exclude email - email is only in auth.users)
      const profileUpdateData: any = {
        full_name: updates.full_name,
        phone: updates.phone,
        role: updates.role,
      };
      
      // Ensure email is not accidentally included
      if ('email' in profileUpdateData) {
        delete profileUpdateData.email;
      }
      
      console.log('Updating profiles table with:', profileUpdateData);

      // Update profile in profiles table (email is not stored here)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId)
        .select()
        .single();

      console.log('Profile update result:', { profileData, profileError });

      if (profileError) throw profileError;

      // If email is being updated, also update the auth user
      if (updates.email) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email: updates.email,
          user_metadata: {
            full_name: updates.full_name,
            phone: updates.phone,
            role: updates.role,
          }
        });

        console.log('Auth user update result:', { authError });

        if (authError) {
          console.error('Auth user update failed:', authError);
          // Don't throw error here, just log it since profile was updated successfully
        }
      }

      return { success: true, user: profileData };
    } catch (error: any) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete user (both auth and profile)
  static async deleteUser(userId: string) {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin service not configured. Please add EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
      }

      // Delete profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Profile deletion failed: ${profileError.message}`);
      }

      // Delete auth user
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) {
        throw new Error(`Auth deletion failed: ${authError.message}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset user password
  static async resetUserPassword(userId: string, newPassword: string) {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin service not configured. Please add EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to your environment variables.');
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate random password
  static generatePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each category
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Generate username from full name
  static generateUsername(fullName: string): string {
    return fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '.') // Replace spaces with dots
      .substring(0, 20); // Limit length
  }
}
