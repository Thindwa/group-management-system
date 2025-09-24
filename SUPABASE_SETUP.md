# Supabase Setup Guide

## 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 2. Configure Environment Variables

Create a `.env` file in your project root with the following content:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase credentials.

## 3. Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Under **Auth Providers**, make sure **Email** is enabled
3. Under **Email Auth**, configure your email settings:
   - **Enable email confirmations**: You can disable this for development
   - **Enable email change confirmations**: You can disable this for development

## 4. Set Up Database Policies

Make sure your database has the proper Row Level Security (RLS) policies set up. The migration files in `supabase/migrations/` should handle this.

## 5. Test the Setup

1. Start your app: `npx expo start`
2. Try to register a new account
3. Check your Supabase dashboard to see if the user appears in the **Authentication** > **Users** section
4. Check the **profiles** table to see if the profile was created

## 6. Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check that your anon key is correct
2. **"Email not confirmed"**: Disable email confirmation in Supabase settings
3. **"Profile not found"**: The app will automatically create a profile for new users
4. **Network errors**: Check your internet connection and Supabase project status

### Debug Steps:

1. Check the Expo logs for any error messages
2. Check your Supabase dashboard for any failed requests
3. Verify your environment variables are loaded correctly
4. Test with a simple email/password combination

## 7. Production Considerations

For production deployment:

1. Enable email confirmations
2. Set up proper email templates
3. Configure rate limiting
4. Set up proper RLS policies
5. Use environment-specific configuration
6. Set up monitoring and logging

## 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 2. Configure Environment Variables

Create a `.env` file in your project root with the following content:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase credentials.

## 3. Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Under **Auth Providers**, make sure **Email** is enabled
3. Under **Email Auth**, configure your email settings:
   - **Enable email confirmations**: You can disable this for development
   - **Enable email change confirmations**: You can disable this for development

## 4. Set Up Database Policies

Make sure your database has the proper Row Level Security (RLS) policies set up. The migration files in `supabase/migrations/` should handle this.

## 5. Test the Setup

1. Start your app: `npx expo start`
2. Try to register a new account
3. Check your Supabase dashboard to see if the user appears in the **Authentication** > **Users** section
4. Check the **profiles** table to see if the profile was created

## 6. Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check that your anon key is correct
2. **"Email not confirmed"**: Disable email confirmation in Supabase settings
3. **"Profile not found"**: The app will automatically create a profile for new users
4. **Network errors**: Check your internet connection and Supabase project status

### Debug Steps:

1. Check the Expo logs for any error messages
2. Check your Supabase dashboard for any failed requests
3. Verify your environment variables are loaded correctly
4. Test with a simple email/password combination

## 7. Production Considerations

For production deployment:

1. Enable email confirmations
2. Set up proper email templates
3. Configure rate limiting
4. Set up proper RLS policies
5. Use environment-specific configuration
6. Set up monitoring and logging
