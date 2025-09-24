const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixContributions() {
  try {
    console.log('🔧 Fixing contributions...\n');
    
    // Get the existing group and admin user
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .limit(1);
    
    if (groupsError || !groups || groups.length === 0) {
      console.log('❌ No group found.');
      return;
    }
    
    const group = groups[0];
    
    // Get the admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'ADMIN')
      .single();
    
    if (adminError || !adminProfile) {
      console.log('❌ No admin user found.');
      return;
    }
    
    // Get the active circle
    const { data: circles, error: circleError } = await supabase
      .from('circles')
      .select('*')
      .eq('status', 'ACTIVE')
      .single();
    
    if (circleError || !circles) {
      console.log('❌ No active circle found');
      return;
    }
    
    // Create sample contributions with all required fields
    console.log('Creating sample contributions...');
    const contributions = [];
    
    for (let quarter = 0; quarter < 4; quarter++) {
      const amount = 10000 + (quarter * 2000); // Different amounts per quarter
      const status = quarter < 2 ? 'PAID' : 'PENDING'; // First 2 quarters paid
      
      contributions.push({
        group_id: group.id,
        circle_id: circles.id,
        member_id: adminProfile.id,
        member_name: adminProfile.full_name,
        amount: amount,
        period_index: quarter,
        quarter: `Q${quarter + 1}`,
        due_date: new Date(2024, quarter * 3, 1).toISOString().split('T')[0],
        status: status,
        payment_method: status === 'PAID' ? 'cash' : null,
        paid_at: status === 'PAID' ? new Date(2024, quarter * 3, 5).toISOString() : null,
        paid_by: status === 'PAID' ? adminProfile.id : null,
        planned_installments: 4,
        method: 'cash',
        contribution_amount_snapshot: amount // Add required field
      });
    }
    
    const { error: contribError } = await supabase
      .from('contributions')
      .insert(contributions);
    
    if (contribError) {
      console.log('❌ Failed to create contributions:', contribError.message);
    } else {
      console.log(`✅ Created ${contributions.length} sample contributions`);
    }
    
    console.log('\n🎉 Contributions fixed successfully!');
    
  } catch (error) {
    console.error('❌ Fixing contributions failed:', error.message);
  }
}

fixContributions();

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixContributions() {
  try {
    console.log('🔧 Fixing contributions...\n');
    
    // Get the existing group and admin user
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .limit(1);
    
    if (groupsError || !groups || groups.length === 0) {
      console.log('❌ No group found.');
      return;
    }
    
    const group = groups[0];
    
    // Get the admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'ADMIN')
      .single();
    
    if (adminError || !adminProfile) {
      console.log('❌ No admin user found.');
      return;
    }
    
    // Get the active circle
    const { data: circles, error: circleError } = await supabase
      .from('circles')
      .select('*')
      .eq('status', 'ACTIVE')
      .single();
    
    if (circleError || !circles) {
      console.log('❌ No active circle found');
      return;
    }
    
    // Create sample contributions with all required fields
    console.log('Creating sample contributions...');
    const contributions = [];
    
    for (let quarter = 0; quarter < 4; quarter++) {
      const amount = 10000 + (quarter * 2000); // Different amounts per quarter
      const status = quarter < 2 ? 'PAID' : 'PENDING'; // First 2 quarters paid
      
      contributions.push({
        group_id: group.id,
        circle_id: circles.id,
        member_id: adminProfile.id,
        member_name: adminProfile.full_name,
        amount: amount,
        period_index: quarter,
        quarter: `Q${quarter + 1}`,
        due_date: new Date(2024, quarter * 3, 1).toISOString().split('T')[0],
        status: status,
        payment_method: status === 'PAID' ? 'cash' : null,
        paid_at: status === 'PAID' ? new Date(2024, quarter * 3, 5).toISOString() : null,
        paid_by: status === 'PAID' ? adminProfile.id : null,
        planned_installments: 4,
        method: 'cash',
        contribution_amount_snapshot: amount // Add required field
      });
    }
    
    const { error: contribError } = await supabase
      .from('contributions')
      .insert(contributions);
    
    if (contribError) {
      console.log('❌ Failed to create contributions:', contribError.message);
    } else {
      console.log(`✅ Created ${contributions.length} sample contributions`);
    }
    
    console.log('\n🎉 Contributions fixed successfully!');
    
  } catch (error) {
    console.error('❌ Fixing contributions failed:', error.message);
  }
}

fixContributions();
