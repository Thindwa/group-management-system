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
import { supabase } from '../services/supabase';

export async function cleanupOrphanedUsers() {
  if (!supabaseAdmin) {
    console.error('Admin service not configured');
    return;
  }

  try {
    console.log('Checking for orphaned users...');
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id');
    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return;
    }

    const profileIds = new Set(profiles?.map(p => p.id) || []);
    
    // Find orphaned auth users (exist in auth but not in profiles)
    const orphanedUsers = authUsers.users?.filter(user => !profileIds.has(user.id)) || [];
    
    console.log(`Found ${orphanedUsers.length} orphaned auth users`);
    
    // Clean up orphaned users
    for (const user of orphanedUsers) {
      console.log(`Cleaning up orphaned user: ${user.email} (${user.id})`);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) {
        console.error(`Error deleting user ${user.email}:`, error);
      } else {
        console.log(`Successfully deleted orphaned user: ${user.email}`);
      }
    }
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
