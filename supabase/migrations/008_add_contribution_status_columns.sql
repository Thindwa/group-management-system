-- Add status and confirmation columns to contributions table
ALTER TABLE public.contributions 
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update existing contributions to be CONFIRMED (assuming they were already processed)
UPDATE public.contributions 
SET status = 'CONFIRMED', confirmed_at = created_at, confirmed_by = created_by
WHERE status IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_confirmed_by ON public.contributions(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_contributions_confirmed_at ON public.contributions(confirmed_at);
