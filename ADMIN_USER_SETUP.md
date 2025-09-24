# Admin User Management Setup

This guide explains how to set up admin user management functionality in your Supabase-based loan management app.

## Overview

The app now includes a comprehensive user management system that allows admins to:
- Create new users with both Supabase Auth accounts and profile records
- Generate secure passwords automatically
- Share credentials securely with users
- Update user profiles and roles
- Delete users (both auth and profile)
- Reset user passwords

## Environment Setup

### 1. Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. Add it to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Security Considerations

⚠️ **Important**: The service role key has full access to your Supabase project. Keep it secure:

- Never commit it to version control
- Use environment variables only
- Consider using a backend API for production instead of exposing it in the client

## How It Works

### User Creation Process

1. **Admin creates user** via the User Management screen
2. **System generates** a secure random password
3. **Supabase Auth user** is created with the service role key
4. **Profile record** is created in the profiles table
5. **Credentials are shared** securely with the admin
6. **User can login** immediately with the provided credentials

### User Management Features

#### Create User
- Full name, phone, email, and role selection
- Automatic password generation (12 characters with mixed case, numbers, symbols)
- Email auto-confirmation (no email verification required)
- Immediate profile creation

#### Manage Users
- View all group members with their roles
- Update user information
- Reset passwords (generates new secure password)
- Delete users (removes both auth and profile)

#### Credentials Sharing
- Secure modal to display generated credentials
- Copy-to-clipboard functionality
- One-time display for security

## Access Control

### Admin-Only Features
- User Management screen is only visible to users with admin roles
- All user management functions require admin privileges
- Regular members cannot access user creation/deletion

### Role-Based Access
- **SUPERADMIN**: Full access to all features
- **ADMIN**: Can manage users and all group features
- **TREASURER**: Can manage financial operations
- **CHAIRPERSON**: Can approve requests
- **AUDITOR**: Can view reports and data
- **MEMBER**: Basic member access only

## Usage Instructions

### For Admins

1. **Navigate to User Management**
   - Go to the admin dashboard
   - Tap on "User Management" tab

2. **Create New User**
   - Tap "Add User" button
   - Fill in user details (name, phone, email, role)
   - Tap "Create User"
   - Copy and share the generated credentials securely

3. **Manage Existing Users**
   - View all users in the list
   - Tap "Reset Password" to generate new credentials
   - Tap "Delete" to remove user (with confirmation)

### For New Users

1. **Receive Credentials**
   - Get email and password from admin
   - Use these to login to the app

2. **First Login**
   - Use provided credentials
   - System will automatically load their profile
   - Access is based on their assigned role

## Technical Implementation

### Files Created/Modified

- `src/services/adminService.ts` - Admin API service
- `src/screens/admin/UserManagementScreen.tsx` - User management UI
- `src/stores/groupStore.ts` - Added user management functions
- `src/navigation/MainNavigator.tsx` - Added User Management tab

### Key Components

#### AdminService Class
- `createUser()` - Creates auth user + profile
- `updateUser()` - Updates user profile
- `deleteUser()` - Deletes auth user + profile
- `resetUserPassword()` - Generates new password
- `generatePassword()` - Creates secure passwords

#### UserManagementScreen
- Form validation with react-hook-form + zod
- Role-based UI restrictions
- Credentials sharing modal
- Real-time member list updates

## Troubleshooting

### Common Issues

1. **"Admin service not configured" error**
   - Add `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` to your `.env` file
   - Restart your development server

2. **User creation fails**
   - Check that email is unique
   - Verify service role key is correct
   - Check Supabase project permissions

3. **Profile creation fails after auth success**
   - Check database permissions for profiles table
   - Verify RLS policies allow profile creation

### Security Best Practices

1. **Never expose service role key in client code for production**
2. **Use environment variables only**
3. **Consider implementing a backend API for user management**
4. **Regularly rotate service role keys**
5. **Monitor user creation/deletion activities**

## Production Considerations

For production deployment, consider:

1. **Backend API**: Move user management to a secure backend API
2. **Email Integration**: Send credentials via email instead of displaying them
3. **Audit Logging**: Log all user management activities
4. **Rate Limiting**: Implement rate limiting for user creation
5. **Validation**: Add additional validation and sanitization

## Support

If you encounter issues:

1. Check the console for error messages
2. Verify your Supabase configuration
3. Ensure all environment variables are set correctly
4. Check Supabase project logs for detailed error information
