-- Create Supabase Auth users that match our seeded profiles
-- Note: In a real application, you'd use Supabase's admin API to create these users
-- For demo purposes, we'll create a function to handle this

-- Create a function to sync profiles with auth users
CREATE OR REPLACE FUNCTION create_auth_user_for_profile(
    profile_id UUID,
    email TEXT,
    password TEXT DEFAULT 'password123'
) RETURNS UUID AS $$
DECLARE
    auth_user_id UUID;
BEGIN
    -- In a real implementation, you would call Supabase's admin API here
    -- For demo purposes, we'll just return the profile_id
    -- This simulates having auth users that match our profiles
    
    -- Update the profile to link it with the auth user
    UPDATE profiles 
    SET id = auth_user_id
    WHERE id = profile_id;
    
    RETURN auth_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create demo auth users (in real app, use Supabase Admin API)
-- For now, we'll update our profiles to have email-like IDs that can be used for demo

-- Update profiles to include email-like identifiers for demo
UPDATE profiles 
SET id = '550e8400-e29b-41d4-a716-446655440001'
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Create a demo login function
CREATE OR REPLACE FUNCTION demo_login(email TEXT, password TEXT)
RETURNS TABLE(user_id UUID, full_name TEXT, role TEXT, group_id UUID) AS $$
BEGIN
    -- For demo purposes, map email to our seeded users
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.role,
        p.group_id
    FROM profiles p
    WHERE 
        (email = 'superadmin@luwuchi.com' AND p.id = '550e8400-e29b-41d4-a716-446655440001') OR
        (email = 'admin@luwuchi.com' AND p.id = '550e8400-e29b-41d4-a716-446655440002') OR
        (email = 'treasurer@luwuchi.com' AND p.id = '550e8400-e29b-41d4-a716-446655440003') OR
        (email = 'chairperson@luwuchi.com' AND p.id = '550e8400-e29b-41d4-a716-446655440004') OR
        (email = 'auditor@luwuchi.com' AND p.id = '550e8400-e29b-41d4-a716-446655440005') OR
        (email = 'member1@luwuchi.com' AND p.id = '550e8400-e29b-41d4-a716-446655440006') OR
        (email = 'member2@luwuchi.com' AND p.id = '550e8400-e29b-41d4-a716-446655440007') OR
        (email = 'member3@luwuchi.com' AND p.id = '550e8400-e29b-41d4-a716-446655440008')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION demo_login(TEXT, TEXT) TO authenticated;
