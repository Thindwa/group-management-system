-- Comprehensive seed data for Luwuchi Savings Group
-- This script creates demo users, groups, and sample data

-- Create demo users first (these would normally be created through Supabase Auth)
INSERT INTO profiles (id, full_name, phone, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Super Admin', '+265991234567', 'SUPERADMIN'),
('550e8400-e29b-41d4-a716-446655440002', 'Admin User', '+265991234568', 'ADMIN'),
('550e8400-e29b-41d4-a716-446655440003', 'Treasurer User', '+265991234569', 'TREASURER'),
('550e8400-e29b-41d4-a716-446655440004', 'Chairperson User', '+265991234570', 'CHAIRPERSON'),
('550e8400-e29b-41d4-a716-446655440005', 'Auditor User', '+265991234571', 'AUDITOR'),
('550e8400-e29b-41d4-a716-446655440006', 'Member One', '+265991234572', 'MEMBER'),
('550e8400-e29b-41d4-a716-446655440007', 'Member Two', '+265991234573', 'MEMBER'),
('550e8400-e29b-41d4-a716-446655440008', 'Member Three', '+265991234574', 'MEMBER')
ON CONFLICT (id) DO NOTHING;

-- Create demo group
INSERT INTO groups (id, name, currency, created_by) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Luwuchi Savings Group',
    'MWK',
    '550e8400-e29b-41d4-a716-446655440001'
) ON CONFLICT (id) DO NOTHING;

-- Update profiles with group_id
UPDATE profiles SET group_id = '550e8400-e29b-41d4-a716-446655440000' WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008'
);

-- Create group settings
INSERT INTO group_settings (
    group_id,
    circle_duration_days,
    contribution_amount_default,
    contribution_strategy,
    contribution_interval_days,
    installments_per_circle,
    allow_member_override,
    funeral_benefit,
    sickness_benefit,
    allowed_relatives,
    loan_interest_percent,
    loan_period_days,
    grace_period_days
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    365,
    10000,
    'INSTALLMENTS_PER_CIRCLE',
    90,
    4,
    false,
    50000,
    30000,
    '["mother","father","sister","brother","child","husband","wife"]',
    20.00,
    30,
    5
) ON CONFLICT (group_id) DO NOTHING;

-- Create current year circle
INSERT INTO circles (
    id,
    group_id,
    year,
    start_date,
    end_date,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440000',
    EXTRACT(YEAR FROM NOW()),
    DATE_TRUNC('year', NOW()),
    DATE_TRUNC('year', NOW()) + INTERVAL '1 year' - INTERVAL '1 day',
    'ACTIVE'
) ON CONFLICT (group_id, year) DO NOTHING;

-- Create member settings
INSERT INTO member_settings (member_id, contribution_amount_override, active) VALUES
('550e8400-e29b-41d4-a716-446655440001', NULL, true),
('550e8400-e29b-41d4-a716-446655440002', NULL, true),
('550e8400-e29b-41d4-a716-446655440003', NULL, true),
('550e8400-e29b-41d4-a716-446655440004', NULL, true),
('550e8400-e29b-41d4-a716-446655440005', NULL, true),
('550e8400-e29b-41d4-a716-446655440006', NULL, true),
('550e8400-e29b-41d4-a716-446655440007', 12000, true), -- Override amount
('550e8400-e29b-41d4-a716-446655440008', NULL, true)
ON CONFLICT (member_id) DO NOTHING;

-- Create sample contributions (only if circle exists)
INSERT INTO contributions (
    group_id,
    circle_id,
    member_id,
    period_index,
    planned_installments,
    amount,
    method,
    note,
    contribution_amount_snapshot,
    created_by
) VALUES 
-- Member One contributions
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 0, 4, 10000, 'cash', 'Q1 contribution', 10000, '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 1, 4, 10000, 'bank_transfer', 'Q2 contribution', 10000, '550e8400-e29b-41d4-a716-446655440003'),
-- Member Two contributions (with override amount)
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', 0, 4, 12000, 'mobile_money', 'Q1 contribution (override)', 12000, '550e8400-e29b-41d4-a716-446655440003'),
-- Member Three - full circle payment
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 0, 4, 40000, 'bank_transfer', 'Full circle payment', 10000, '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT DO NOTHING;

-- Create sample loans
INSERT INTO loans (
    id,
    group_id,
    circle_id,
    borrower_id,
    principal,
    disbursed_by,
    disbursed_at,
    due_at,
    status,
    grace_period_days,
    grace_source,
    notes
) VALUES 
-- Loan within grace period
('550e8400-e29b-41d4-a716-446655440020',
 '550e8400-e29b-41d4-a716-446655440000',
 '550e8400-e29b-41d4-a716-446655440010',
 '550e8400-e29b-41d4-a716-446655440006',
 25000,
 '550e8400-e29b-41d4-a716-446655440003',
 NOW() - INTERVAL '10 days',
 NOW() + INTERVAL '20 days',
 'ACTIVE',
 5,
 'DEFAULT',
 'Emergency loan for medical expenses'),
-- Loan with override grace period
('550e8400-e29b-41d4-a716-446655440021',
 '550e8400-e29b-41d4-a716-446655440000',
 '550e8400-e29b-41d4-a716-446655440010',
 '550e8400-e29b-41d4-a716-446655440007',
 15000,
 '550e8400-e29b-41d4-a716-446655440003',
 NOW() - INTERVAL '5 days',
 NOW() + INTERVAL '25 days',
 'ACTIVE',
 10,
 'OVERRIDE',
 'Business loan with extended grace period'),
-- Overdue loan
('550e8400-e29b-41d4-a716-446655440022',
 '550e8400-e29b-41d4-a716-446655440000',
 '550e8400-e29b-41d4-a716-446655440010',
 '550e8400-e29b-41d4-a716-446655440008',
 30000,
 '550e8400-e29b-41d4-a716-446655440003',
 NOW() - INTERVAL '45 days',
 NOW() - INTERVAL '15 days',
 'OVERDUE',
 5,
 'DEFAULT',
 'Overdue loan for demonstration')
ON CONFLICT (id) DO NOTHING;

-- Create loan payments
INSERT INTO loan_payments (
    loan_id,
    amount,
    paid_at,
    method,
    note
) VALUES 
('550e8400-e29b-41d4-a716-446655440020', 5000, NOW() - INTERVAL '5 days', 'cash', 'Partial payment'),
('550e8400-e29b-41d4-a716-446655440021', 3000, NOW() - INTERVAL '2 days', 'bank_transfer', 'First payment'),
('550e8400-e29b-41d4-a716-446655440022', 10000, NOW() - INTERVAL '30 days', 'mobile_money', 'Initial payment')
ON CONFLICT DO NOTHING;

-- Create sample benefits
INSERT INTO benefits (
    group_id,
    circle_id,
    member_id,
    type,
    relative_type,
    relative_name,
    requested_amount,
    status,
    requested_at,
    approved_by,
    approved_at,
    paid_by,
    paid_at
) VALUES 
-- Pending funeral benefit
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 'FUNERAL', 'mother', 'Jane Doe', 50000, 'PENDING', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL),
-- Approved sickness benefit
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', 'SICKNESS', 'father', 'John Smith', 30000, 'APPROVED', NOW() - INTERVAL '5 days', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '1 day', NULL, NULL),
-- Paid funeral benefit
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'FUNERAL', 'sister', 'Mary Johnson', 50000, 'PAID', NOW() - INTERVAL '10 days', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '8 days', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Create sample ledger entries
INSERT INTO ledger (
    group_id,
    circle_id,
    member_id,
    type,
    ref_id,
    amount,
    direction,
    created_by
) VALUES 
-- Contribution entries
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 'CONTRIBUTION_IN', (SELECT id FROM contributions WHERE member_id = '550e8400-e29b-41d4-a716-446655440006' AND period_index = 0 LIMIT 1), 10000, 'IN', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 'CONTRIBUTION_IN', (SELECT id FROM contributions WHERE member_id = '550e8400-e29b-41d4-a716-446655440006' AND period_index = 1 LIMIT 1), 10000, 'IN', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', 'CONTRIBUTION_IN', (SELECT id FROM contributions WHERE member_id = '550e8400-e29b-41d4-a716-446655440007' AND period_index = 0 LIMIT 1), 12000, 'IN', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'CONTRIBUTION_IN', (SELECT id FROM contributions WHERE member_id = '550e8400-e29b-41d4-a716-446655440008' AND period_index = 0 LIMIT 1), 40000, 'IN', '550e8400-e29b-41d4-a716-446655440003'),
-- Loan entries
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 'LOAN_OUT', '550e8400-e29b-41d4-a716-446655440020', 25000, 'OUT', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', 'LOAN_OUT', '550e8400-e29b-41d4-a716-446655440021', 15000, 'OUT', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'LOAN_OUT', '550e8400-e29b-41d4-a716-446655440022', 30000, 'OUT', '550e8400-e29b-41d4-a716-446655440003'),
-- Loan repayment entries
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', 'LOAN_REPAYMENT_IN', '550e8400-e29b-41d4-a716-446655440020', 5000, 'IN', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440007', 'LOAN_REPAYMENT_IN', '550e8400-e29b-41d4-a716-446655440021', 3000, 'IN', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'LOAN_REPAYMENT_IN', '550e8400-e29b-41d4-a716-446655440022', 10000, 'IN', '550e8400-e29b-41d4-a716-446655440003'),
-- Benefit entries
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'BENEFIT_OUT', (SELECT id FROM benefits WHERE member_id = '550e8400-e29b-41d4-a716-446655440008' AND status = 'PAID' LIMIT 1), 50000, 'OUT', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT DO NOTHING;

-- Create sample loan events
INSERT INTO loan_events (
    loan_id,
    type,
    data,
    actor_id
) VALUES 
('550e8400-e29b-41d4-a716-446655440020', 'CREATED', '{"principal": 25000, "grace_period_days": 5}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440020', 'DISBURSED', '{"disbursed_at": "2024-01-01T00:00:00Z"}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440020', 'PAYMENT', '{"amount": 5000, "method": "cash"}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440021', 'CREATED', '{"principal": 15000, "grace_period_days": 10}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440021', 'DISBURSED', '{"disbursed_at": "2024-01-01T00:00:00Z"}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440021', 'GRACE_EXTENDED', '{"new_grace_days": 10, "previous_grace_days": 5}', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440021', 'PAYMENT', '{"amount": 3000, "method": "bank_transfer"}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440022', 'CREATED', '{"principal": 30000, "grace_period_days": 5}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440022', 'DISBURSED', '{"disbursed_at": "2024-01-01T00:00:00Z"}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440022', 'PAYMENT', '{"amount": 10000, "method": "mobile_money"}', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT DO NOTHING;

-- Create sample audit log entries
INSERT INTO audit_log (
    actor_id,
    action,
    entity,
    entity_id,
    payload
) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'CREATE_GROUP', 'groups', '550e8400-e29b-41d4-a716-446655440000', '{"name": "Luwuchi Savings Group", "currency": "MWK"}'),
('550e8400-e29b-41d4-a716-446655440003', 'RECORD_CONTRIBUTION', 'contributions', (SELECT id FROM contributions LIMIT 1), '{"amount": 10000, "method": "cash"}'),
('550e8400-e29b-41d4-a716-446655440003', 'DISBURSE_LOAN', 'loans', '550e8400-e29b-41d4-a716-446655440020', '{"principal": 25000, "grace_period_days": 5}'),
('550e8400-e29b-41d4-a716-446655440004', 'APPROVE_BENEFIT', 'benefits', (SELECT id FROM benefits WHERE status = 'APPROVED' LIMIT 1), '{"type": "SICKNESS", "amount": 30000}'),
('550e8400-e29b-41d4-a716-446655440003', 'PAY_BENEFIT', 'benefits', (SELECT id FROM benefits WHERE status = 'PAID' LIMIT 1), '{"type": "FUNERAL", "amount": 50000}')
ON CONFLICT DO NOTHING;

    entity_id,
    payload
) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'CREATE_GROUP', 'groups', '550e8400-e29b-41d4-a716-446655440000', '{"name": "Luwuchi Savings Group", "currency": "MWK"}'),
('550e8400-e29b-41d4-a716-446655440003', 'RECORD_CONTRIBUTION', 'contributions', (SELECT id FROM contributions LIMIT 1), '{"amount": 10000, "method": "cash"}'),
('550e8400-e29b-41d4-a716-446655440003', 'DISBURSE_LOAN', 'loans', '550e8400-e29b-41d4-a716-446655440020', '{"principal": 25000, "grace_period_days": 5}'),
('550e8400-e29b-41d4-a716-446655440004', 'APPROVE_BENEFIT', 'benefits', (SELECT id FROM benefits WHERE status = 'APPROVED' LIMIT 1), '{"type": "SICKNESS", "amount": 30000}'),
('550e8400-e29b-41d4-a716-446655440003', 'PAY_BENEFIT', 'benefits', (SELECT id FROM benefits WHERE status = 'PAID' LIMIT 1), '{"type": "FUNERAL", "amount": 50000}')
ON CONFLICT DO NOTHING;
