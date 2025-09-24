-- Add missing fields to contributions table
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS quarter TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money'));

-- Update existing contributions to have proper status
UPDATE contributions 
SET status = 'PAID' 
WHERE amount > 0;

-- Add member_name for easier querying (denormalized field)
ALTER TABLE contributions 
ADD COLUMN IF NOT EXISTS member_name TEXT;

-- Update member_name for existing contributions
UPDATE contributions 
SET member_name = p.full_name
FROM profiles p 
WHERE contributions.member_id = p.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_due_date ON contributions(due_date);
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);
