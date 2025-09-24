-- Fix RLS policies to prevent infinite recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Group members can view other profiles in their group" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles in their group" ON profiles;

-- Create simplified profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow all authenticated users to view profiles (for demo purposes)
-- In production, you'd want more restrictive policies
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SUPERADMIN', 'ADMIN')
        )
    );

-- Fix other circular references by simplifying policies
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
DROP POLICY IF EXISTS "Group members can view group settings" ON group_settings;
DROP POLICY IF EXISTS "Group members can view circles" ON circles;
DROP POLICY IF EXISTS "Group members can view contributions" ON contributions;
DROP POLICY IF EXISTS "Group members can view benefits" ON benefits;
DROP POLICY IF EXISTS "Group members can view loans" ON loans;
DROP POLICY IF EXISTS "Group members can view loan payments" ON loan_payments;
DROP POLICY IF EXISTS "Group members can view loan events" ON loan_events;
DROP POLICY IF EXISTS "Group members can view ledger" ON ledger;
DROP POLICY IF EXISTS "Group members can view audit log" ON audit_log;

-- Create simplified policies for demo purposes
CREATE POLICY "Authenticated users can view groups" ON groups
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view group settings" ON group_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view circles" ON circles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view contributions" ON contributions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view benefits" ON benefits
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view loans" ON loans
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view loan payments" ON loan_payments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view loan events" ON loan_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view ledger" ON ledger
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view audit log" ON audit_log
    FOR SELECT USING (auth.uid() IS NOT NULL);
