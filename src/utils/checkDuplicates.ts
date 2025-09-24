import { supabase } from '../services/supabase';

export async function checkForDuplicateProfiles() {
  try {
    console.log('Checking for duplicate profiles...');
    
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    console.log(`Total profiles: ${profiles?.length || 0}`);
    
    // Check for duplicate IDs
    const ids = profiles?.map(p => p.id) || [];
    const uniqueIds = new Set(ids);
    
    if (ids.length !== uniqueIds.size) {
      console.warn(`Found ${ids.length - uniqueIds.size} duplicate profile IDs`);
      
      // Find duplicates
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('Duplicate IDs:', duplicates);
    } else {
      console.log('No duplicate profile IDs found');
    }
    
    // Check for duplicate phone numbers
    const phones = profiles?.map(p => p.phone).filter(Boolean) || [];
    const uniquePhones = new Set(phones);
    
    if (phones.length !== uniquePhones.size) {
      console.warn(`Found ${phones.length - uniquePhones.size} duplicate phone numbers`);
    } else {
      console.log('No duplicate phone numbers found');
    }
    
    return profiles;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return null;
  }
}
