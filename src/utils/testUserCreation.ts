import { AdminService } from '../services/adminService';

export async function testUserCreation() {
  console.log('Testing user creation...');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    full_name: 'Test User',
    phone: '+1234567890',
    role: 'MEMBER',
    group_id: 'test-group-id'
  };

  try {
    const result = await AdminService.createUser(testUser);
    
    if (result.success) {
      console.log('✅ User creation test passed');
      console.log('Created user:', result.user);
      return result;
    } else {
      console.log('❌ User creation test failed:', result.error);
      return null;
    }
  } catch (error: any) {
    console.log('❌ User creation test error:', error.message);
    return null;
  }
}
