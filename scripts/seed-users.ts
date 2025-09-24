import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const users = [
  {
    email: 'super@group.mw',
    password: 'Passw0rd!',
    full_name: 'Super Admin',
    phone: '+265991234567',
    role: 'SUPERADMIN'
  },
  {
    email: 'admin@group.mw',
    password: 'Passw0rd!',
    full_name: 'Admin User',
    phone: '+265991234568',
    role: 'ADMIN'
  },
  {
    email: 'treasurer@group.mw',
    password: 'Passw0rd!',
    full_name: 'Treasurer User',
    phone: '+265991234569',
    role: 'TREASURER'
  },
  {
    email: 'chair@group.mw',
    password: 'Passw0rd!',
    full_name: 'Chairperson User',
    phone: '+265991234570',
    role: 'CHAIRPERSON'
  },
  {
    email: 'auditor@group.mw',
    password: 'Passw0rd!',
    full_name: 'Auditor User',
    phone: '+265991234571',
    role: 'AUDITOR'
  },
  {
    email: 'member1@group.mw',
    password: 'Passw0rd!',
    full_name: 'Member One',
    phone: '+265991234572',
    role: 'MEMBER'
  }
];

async function createAuthUsers() {
  console.log('Creating auth users...');
  
  for (const user of users) {
    try {
      // Create auth user using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: {
          full_name: user.full_name,
          phone: user.phone,
          role: user.role
        }
      });

      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError);
        continue;
      }

      console.log(`✅ Created auth user: ${user.email}`);

      // Update profile with role and group
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          group_id: '550e8400-e29b-41d4-a716-446655440000' // Default group ID
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`Error updating profile for ${user.email}:`, profileError);
      } else {
        console.log(`✅ Updated profile for: ${user.email}`);
      }

    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }
}

async function createGroupAndSettings() {
  console.log('Creating group and settings...');
  
  try {
    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Luwuchi Savings Group',
        currency: 'MWK',
        created_by: '550e8400-e29b-41d4-a716-446655440001' // Super admin ID
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      return;
    }

    console.log('✅ Created group:', group.name);

    // Create group settings with all new fields
    const { error: settingsError } = await supabase
      .from('group_settings')
      .insert({
        group_id: group.id,
        circle_duration_days: 365,
        contribution_amount_default: 10000,
        contribution_strategy: 'INSTALLMENTS_PER_CIRCLE',
        contribution_interval_days: 90,
        installments_per_circle: 4,
        allow_member_override: false,
        funeral_benefit: 50000,
        sickness_benefit: 30000,
        allowed_relatives: ['mother', 'father', 'sister', 'brother', 'child', 'husband', 'wife'],
        loan_interest_percent: 20,
        loan_period_days: 30,
        grace_period_days: 5,
        reserve_min_balance: 0,
        auto_waitlist_if_insufficient: true,
        auto_waitlist_processing: true,
        waitlist_policy: 'BENEFITS_FIRST'
      });

    if (settingsError) {
      console.error('Error creating group settings:', settingsError);
    } else {
      console.log('✅ Created group settings');
    }

    // Create active circle
    const { error: circleError } = await supabase
      .from('circles')
      .insert({
        group_id: group.id,
        year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'ACTIVE'
      });

    if (circleError) {
      console.error('Error creating circle:', circleError);
    } else {
      console.log('✅ Created active circle');
    }

  } catch (error) {
    console.error('Error creating group and settings:', error);
  }
}

async function main() {
  console.log('Starting seed process...');
  
  await createGroupAndSettings();
  await createAuthUsers();
  
  console.log('✅ Seed process completed!');
  console.log('\nDemo credentials:');
  users.forEach(user => {
    console.log(`${user.email} / ${user.password} (${user.role})`);
  });
}

main().catch(console.error);
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const users = [
  {
    email: 'super@group.mw',
    password: 'Passw0rd!',
    full_name: 'Super Admin',
    phone: '+265991234567',
    role: 'SUPERADMIN'
  },
  {
    email: 'admin@group.mw',
    password: 'Passw0rd!',
    full_name: 'Admin User',
    phone: '+265991234568',
    role: 'ADMIN'
  },
  {
    email: 'treasurer@group.mw',
    password: 'Passw0rd!',
    full_name: 'Treasurer User',
    phone: '+265991234569',
    role: 'TREASURER'
  },
  {
    email: 'chair@group.mw',
    password: 'Passw0rd!',
    full_name: 'Chairperson User',
    phone: '+265991234570',
    role: 'CHAIRPERSON'
  },
  {
    email: 'auditor@group.mw',
    password: 'Passw0rd!',
    full_name: 'Auditor User',
    phone: '+265991234571',
    role: 'AUDITOR'
  },
  {
    email: 'member1@group.mw',
    password: 'Passw0rd!',
    full_name: 'Member One',
    phone: '+265991234572',
    role: 'MEMBER'
  }
];

async function createAuthUsers() {
  console.log('Creating auth users...');
  
  for (const user of users) {
    try {
      // Create auth user using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: {
          full_name: user.full_name,
          phone: user.phone,
          role: user.role
        }
      });

      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError);
        continue;
      }

      console.log(`✅ Created auth user: ${user.email}`);

      // Update profile with role and group
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          group_id: '550e8400-e29b-41d4-a716-446655440000' // Default group ID
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`Error updating profile for ${user.email}:`, profileError);
      } else {
        console.log(`✅ Updated profile for: ${user.email}`);
      }

    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }
}

async function createGroupAndSettings() {
  console.log('Creating group and settings...');
  
  try {
    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Luwuchi Savings Group',
        currency: 'MWK',
        created_by: '550e8400-e29b-41d4-a716-446655440001' // Super admin ID
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      return;
    }

    console.log('✅ Created group:', group.name);

    // Create group settings with all new fields
    const { error: settingsError } = await supabase
      .from('group_settings')
      .insert({
        group_id: group.id,
        circle_duration_days: 365,
        contribution_amount_default: 10000,
        contribution_strategy: 'INSTALLMENTS_PER_CIRCLE',
        contribution_interval_days: 90,
        installments_per_circle: 4,
        allow_member_override: false,
        funeral_benefit: 50000,
        sickness_benefit: 30000,
        allowed_relatives: ['mother', 'father', 'sister', 'brother', 'child', 'husband', 'wife'],
        loan_interest_percent: 20,
        loan_period_days: 30,
        grace_period_days: 5,
        reserve_min_balance: 0,
        auto_waitlist_if_insufficient: true,
        auto_waitlist_processing: true,
        waitlist_policy: 'BENEFITS_FIRST'
      });

    if (settingsError) {
      console.error('Error creating group settings:', settingsError);
    } else {
      console.log('✅ Created group settings');
    }

    // Create active circle
    const { error: circleError } = await supabase
      .from('circles')
      .insert({
        group_id: group.id,
        year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'ACTIVE'
      });

    if (circleError) {
      console.error('Error creating circle:', circleError);
    } else {
      console.log('✅ Created active circle');
    }

  } catch (error) {
    console.error('Error creating group and settings:', error);
  }
}

async function main() {
  console.log('Starting seed process...');
  
  await createGroupAndSettings();
  await createAuthUsers();
  
  console.log('✅ Seed process completed!');
  console.log('\nDemo credentials:');
  users.forEach(user => {
    console.log(`${user.email} / ${user.password} (${user.role})`);
  });
}

main().catch(console.error);
