-- Temporarily disable RLS for all tables during development
-- This allows the app to work while we test functionality
-- In production, you would use proper RLS policies

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE circles DISABLE ROW LEVEL SECURITY;
ALTER TABLE contributions DISABLE ROW LEVEL SECURITY;
ALTER TABLE benefits DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE loan_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Note: This is for development only!
-- In production, you should:
-- 1. Enable RLS on all tables
-- 2. Use the proper RLS policies from migration 016
-- 3. Test thoroughly with different user roles
