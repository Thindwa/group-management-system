-- Add waitlist fields to group_settings
ALTER TABLE group_settings 
ADD COLUMN IF NOT EXISTS reserve_min_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_waitlist_if_insufficient BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_waitlist_processing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS waitlist_policy TEXT CHECK (waitlist_policy IN ('FIFO','BENEFITS_FIRST','LOANS_FIRST')) DEFAULT 'BENEFITS_FIRST';

-- Add waitlist fields to benefits
ALTER TABLE benefits 
ADD COLUMN IF NOT EXISTS waitlisted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER;

-- Add waitlist fields to loans
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS waitlisted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER;

-- Update benefits status check to include WAITLISTED
ALTER TABLE benefits DROP CONSTRAINT IF EXISTS benefits_status_check;
ALTER TABLE benefits ADD CONSTRAINT benefits_status_check 
CHECK (status IN ('PENDING','WAITLISTED','APPROVED','PAID','REJECTED'));

-- Update loans status check to include WAITLISTED
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_status_check 
CHECK (status IN ('ACTIVE','WAITLISTED','CLOSED','OVERDUE'));

-- Create indexes for waitlist fields
CREATE INDEX IF NOT EXISTS idx_benefits_waitlist ON benefits(group_id, status, waitlist_position) WHERE status = 'WAITLISTED';
CREATE INDEX IF NOT EXISTS idx_loans_waitlist ON loans(group_id, status, waitlist_position) WHERE status = 'WAITLISTED';
ALTER TABLE group_settings 
ADD COLUMN IF NOT EXISTS reserve_min_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_waitlist_if_insufficient BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_waitlist_processing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS waitlist_policy TEXT CHECK (waitlist_policy IN ('FIFO','BENEFITS_FIRST','LOANS_FIRST')) DEFAULT 'BENEFITS_FIRST';

-- Add waitlist fields to benefits
ALTER TABLE benefits 
ADD COLUMN IF NOT EXISTS waitlisted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER;

-- Add waitlist fields to loans
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS waitlisted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER;

-- Update benefits status check to include WAITLISTED
ALTER TABLE benefits DROP CONSTRAINT IF EXISTS benefits_status_check;
ALTER TABLE benefits ADD CONSTRAINT benefits_status_check 
CHECK (status IN ('PENDING','WAITLISTED','APPROVED','PAID','REJECTED'));

-- Update loans status check to include WAITLISTED
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_status_check 
CHECK (status IN ('ACTIVE','WAITLISTED','CLOSED','OVERDUE'));

-- Create indexes for waitlist fields
CREATE INDEX IF NOT EXISTS idx_benefits_waitlist ON benefits(group_id, status, waitlist_position) WHERE status = 'WAITLISTED';
CREATE INDEX IF NOT EXISTS idx_loans_waitlist ON loans(group_id, status, waitlist_position) WHERE status = 'WAITLISTED';
