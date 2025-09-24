-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create groups table first
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'MWK',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('SUPERADMIN','ADMIN','TREASURER','CHAIRPERSON','AUDITOR','MEMBER')) DEFAULT 'MEMBER',
    group_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint after both tables exist
ALTER TABLE groups ADD CONSTRAINT groups_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create group_settings table with all specified fields
CREATE TABLE group_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE UNIQUE,
    circle_duration_days INTEGER DEFAULT 365,
    contribution_amount_default INTEGER DEFAULT 10000,
    contribution_strategy TEXT CHECK (contribution_strategy IN ('MONTHLY','INTERVAL_DAYS','INSTALLMENTS_PER_CIRCLE')) DEFAULT 'INSTALLMENTS_PER_CIRCLE',
    contribution_interval_days INTEGER DEFAULT 90,
    installments_per_circle INTEGER DEFAULT 4,
    allow_member_override BOOLEAN DEFAULT false,
    funeral_benefit INTEGER DEFAULT 50000,
    sickness_benefit INTEGER DEFAULT 30000,
    allowed_relatives JSONB DEFAULT '["mother","father","sister","brother","child","husband","wife"]',
    loan_interest_percent NUMERIC DEFAULT 20,
    loan_period_days INTEGER DEFAULT 30,
    grace_period_days INTEGER DEFAULT 0,
    reserve_min_balance INTEGER DEFAULT 0,
    auto_waitlist_if_insufficient BOOLEAN DEFAULT true,
    auto_waitlist_processing BOOLEAN DEFAULT true,
    waitlist_policy TEXT CHECK (waitlist_policy IN ('FIFO','BENEFITS_FIRST','LOANS_FIRST')) DEFAULT 'BENEFITS_FIRST',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create member_settings table
CREATE TABLE member_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    contribution_amount_override INTEGER NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create circles table
CREATE TABLE circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('ACTIVE','CLOSED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contributions table
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    period_index INTEGER NOT NULL,
    planned_installments INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    method TEXT NOT NULL,
    note TEXT,
    attachment_url TEXT,
    contribution_amount_snapshot INTEGER NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create benefits table with waitlist fields
CREATE TABLE benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('FUNERAL','SICKNESS')) NOT NULL,
    relative_type TEXT NOT NULL,
    relative_name TEXT NOT NULL,
    requested_amount INTEGER NOT NULL,
    status TEXT CHECK (status IN ('PENDING','WAITLISTED','APPROVED','PAID','REJECTED')) DEFAULT 'PENDING',
    attachments JSONB DEFAULT '[]',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    waitlisted_at TIMESTAMPTZ,
    waitlist_position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loans table with waitlist fields
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    borrower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    principal INTEGER NOT NULL,
    disbursed_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    disbursed_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('ACTIVE','WAITLISTED','CLOSED','OVERDUE')) DEFAULT 'ACTIVE',
    grace_period_days INTEGER NULL,
    grace_source TEXT CHECK (grace_source IN ('DEFAULT','OVERRIDE','ADJUSTED')) DEFAULT 'DEFAULT',
    grace_adjusted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    grace_adjusted_at TIMESTAMPTZ,
    notes TEXT,
    waitlisted_at TIMESTAMPTZ,
    waitlist_position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loan_payments table
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL,
    method TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loan_events table
CREATE TABLE loan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('CREATED','DISBURSED','GRACE_SET','GRACE_EXTENDED','PAYMENT','CLOSED','REOPENED')) NOT NULL,
    data JSONB DEFAULT '{}',
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ledger table
CREATE TABLE ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('CONTRIBUTION_IN','BENEFIT_OUT','LOAN_OUT','LOAN_REPAYMENT_IN','ADJUSTMENT')) NOT NULL,
    ref_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    direction TEXT CHECK (direction IN ('IN','OUT')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create audit_log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_group_id ON profiles(group_id);
CREATE INDEX idx_contributions_group_id ON contributions(group_id);
CREATE INDEX idx_contributions_member_id ON contributions(member_id);
CREATE INDEX idx_benefits_group_id ON benefits(group_id);
CREATE INDEX idx_benefits_member_id ON benefits(member_id);
CREATE INDEX idx_benefits_status ON benefits(status);
CREATE INDEX idx_loans_group_id ON loans(group_id);
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX idx_ledger_group_id ON ledger(group_id);
CREATE INDEX idx_ledger_circle_id ON ledger(circle_id);
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create groups table first
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'MWK',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('SUPERADMIN','ADMIN','TREASURER','CHAIRPERSON','AUDITOR','MEMBER')) DEFAULT 'MEMBER',
    group_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint after both tables exist
ALTER TABLE groups ADD CONSTRAINT groups_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create group_settings table with all specified fields
CREATE TABLE group_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE UNIQUE,
    circle_duration_days INTEGER DEFAULT 365,
    contribution_amount_default INTEGER DEFAULT 10000,
    contribution_strategy TEXT CHECK (contribution_strategy IN ('MONTHLY','INTERVAL_DAYS','INSTALLMENTS_PER_CIRCLE')) DEFAULT 'INSTALLMENTS_PER_CIRCLE',
    contribution_interval_days INTEGER DEFAULT 90,
    installments_per_circle INTEGER DEFAULT 4,
    allow_member_override BOOLEAN DEFAULT false,
    funeral_benefit INTEGER DEFAULT 50000,
    sickness_benefit INTEGER DEFAULT 30000,
    allowed_relatives JSONB DEFAULT '["mother","father","sister","brother","child","husband","wife"]',
    loan_interest_percent NUMERIC DEFAULT 20,
    loan_period_days INTEGER DEFAULT 30,
    grace_period_days INTEGER DEFAULT 0,
    reserve_min_balance INTEGER DEFAULT 0,
    auto_waitlist_if_insufficient BOOLEAN DEFAULT true,
    auto_waitlist_processing BOOLEAN DEFAULT true,
    waitlist_policy TEXT CHECK (waitlist_policy IN ('FIFO','BENEFITS_FIRST','LOANS_FIRST')) DEFAULT 'BENEFITS_FIRST',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create member_settings table
CREATE TABLE member_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    contribution_amount_override INTEGER NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create circles table
CREATE TABLE circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('ACTIVE','CLOSED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contributions table
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    period_index INTEGER NOT NULL,
    planned_installments INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    method TEXT NOT NULL,
    note TEXT,
    attachment_url TEXT,
    contribution_amount_snapshot INTEGER NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create benefits table with waitlist fields
CREATE TABLE benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('FUNERAL','SICKNESS')) NOT NULL,
    relative_type TEXT NOT NULL,
    relative_name TEXT NOT NULL,
    requested_amount INTEGER NOT NULL,
    status TEXT CHECK (status IN ('PENDING','WAITLISTED','APPROVED','PAID','REJECTED')) DEFAULT 'PENDING',
    attachments JSONB DEFAULT '[]',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    waitlisted_at TIMESTAMPTZ,
    waitlist_position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loans table with waitlist fields
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    borrower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    principal INTEGER NOT NULL,
    disbursed_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    disbursed_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('ACTIVE','WAITLISTED','CLOSED','OVERDUE')) DEFAULT 'ACTIVE',
    grace_period_days INTEGER NULL,
    grace_source TEXT CHECK (grace_source IN ('DEFAULT','OVERRIDE','ADJUSTED')) DEFAULT 'DEFAULT',
    grace_adjusted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    grace_adjusted_at TIMESTAMPTZ,
    notes TEXT,
    waitlisted_at TIMESTAMPTZ,
    waitlist_position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loan_payments table
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL,
    method TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loan_events table
CREATE TABLE loan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('CREATED','DISBURSED','GRACE_SET','GRACE_EXTENDED','PAYMENT','CLOSED','REOPENED')) NOT NULL,
    data JSONB DEFAULT '{}',
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ledger table
CREATE TABLE ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('CONTRIBUTION_IN','BENEFIT_OUT','LOAN_OUT','LOAN_REPAYMENT_IN','ADJUSTMENT')) NOT NULL,
    ref_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    direction TEXT CHECK (direction IN ('IN','OUT')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create audit_log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_group_id ON profiles(group_id);
CREATE INDEX idx_contributions_group_id ON contributions(group_id);
CREATE INDEX idx_contributions_member_id ON contributions(member_id);
CREATE INDEX idx_benefits_group_id ON benefits(group_id);
CREATE INDEX idx_benefits_member_id ON benefits(member_id);
CREATE INDEX idx_benefits_status ON benefits(status);
CREATE INDEX idx_loans_group_id ON loans(group_id);
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX idx_ledger_group_id ON ledger(group_id);
CREATE INDEX idx_ledger_circle_id ON ledger(circle_id);
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
