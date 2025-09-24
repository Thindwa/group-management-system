-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can view group_settings" ON group_settings;
DROP POLICY IF EXISTS "Authenticated users can view circles" ON circles;
DROP POLICY IF EXISTS "Authenticated users can view contributions" ON contributions;
DROP POLICY IF EXISTS "Authenticated users can view benefits" ON benefits;
DROP POLICY IF EXISTS "Authenticated users can view loans" ON loans;
DROP POLICY IF EXISTS "Authenticated users can view loan_payments" ON loan_payments;
DROP POLICY IF EXISTS "Authenticated users can view ledger" ON ledger;
DROP POLICY IF EXISTS "Authenticated users can view audit_log" ON audit_log;

-- Create helper function to get user's group_id
CREATE OR REPLACE FUNCTION get_user_group_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT group_id 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = ANY(required_roles)
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GROUPS POLICIES
CREATE POLICY "Users can view their own group" ON groups
    FOR SELECT USING (id = get_user_group_id());

CREATE POLICY "Group admins can update their group" ON groups
    FOR UPDATE USING (
        id = get_user_group_id() 
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN'])
    );

-- GROUP_SETTINGS POLICIES
CREATE POLICY "Group members can view group settings" ON group_settings
    FOR SELECT USING (group_id = get_user_group_id());

CREATE POLICY "Group admins can update group settings" ON group_settings
    FOR ALL USING (
        group_id = get_user_group_id() 
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN'])
    );

-- PROFILES POLICIES
CREATE POLICY "Users can view profiles in their group" ON profiles
    FOR SELECT USING (group_id = get_user_group_id());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their group" ON profiles
    FOR ALL USING (
        group_id = get_user_group_id() 
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN'])
    );

-- CIRCLES POLICIES
CREATE POLICY "Group members can view circles" ON circles
    FOR SELECT USING (group_id = get_user_group_id());

CREATE POLICY "Group admins can manage circles" ON circles
    FOR ALL USING (
        group_id = get_user_group_id() 
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN'])
    );

-- CONTRIBUTIONS POLICIES
CREATE POLICY "Group members can view contributions" ON contributions
    FOR SELECT USING (group_id = get_user_group_id());

CREATE POLICY "Group members can insert contributions" ON contributions
    FOR INSERT WITH CHECK (
        group_id = get_user_group_id() 
        AND member_id = auth.uid()
    );

CREATE POLICY "Treasurers can update contributions" ON contributions
    FOR UPDATE USING (
        group_id = get_user_group_id() 
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN', 'TREASURER'])
    );

-- BENEFITS POLICIES
CREATE POLICY "Group members can view benefits" ON benefits
    FOR SELECT USING (group_id = get_user_group_id());

CREATE POLICY "Group members can request benefits" ON benefits
    FOR INSERT WITH CHECK (
        group_id = get_user_group_id() 
        AND member_id = auth.uid()
    );

CREATE POLICY "Treasurers can manage benefits" ON benefits
    FOR UPDATE USING (
        group_id = get_user_group_id() 
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN', 'TREASURER'])
    );

-- LOANS POLICIES
CREATE POLICY "Group members can view loans" ON loans
    FOR SELECT USING (group_id = get_user_group_id());

CREATE POLICY "Group members can request loans" ON loans
    FOR INSERT WITH CHECK (
        group_id = get_user_group_id() 
        AND borrower_id = auth.uid()
    );

CREATE POLICY "Treasurers can manage loans" ON loans
    FOR UPDATE USING (
        group_id = get_user_group_id() 
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN', 'TREASURER'])
    );

-- LOAN_PAYMENTS POLICIES
CREATE POLICY "Group members can view loan payments" ON loan_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM loans 
            WHERE id = loan_payments.loan_id 
            AND group_id = get_user_group_id()
        )
    );

CREATE POLICY "Treasurers can manage loan payments" ON loan_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM loans 
            WHERE id = loan_payments.loan_id 
            AND group_id = get_user_group_id()
        )
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN', 'TREASURER'])
    );

-- LEDGER POLICIES
CREATE POLICY "Group members can view ledger" ON ledger
    FOR SELECT USING (group_id = get_user_group_id());

CREATE POLICY "Treasurers can manage ledger" ON ledger
    FOR ALL USING (
        group_id = get_user_group_id() 
        AND user_has_role(ARRAY['SUPERADMIN', 'ADMIN', 'TREASURER'])
    );

-- AUDIT_LOG POLICIES
CREATE POLICY "Group members can view audit log" ON audit_log
    FOR SELECT USING (group_id = get_user_group_id());

CREATE POLICY "System can insert audit log" ON audit_log
    FOR INSERT WITH CHECK (group_id = get_user_group_id());
