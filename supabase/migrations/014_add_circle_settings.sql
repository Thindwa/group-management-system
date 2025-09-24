-- Create circle_settings table for circle-specific settings
CREATE TABLE IF NOT EXISTS circle_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  contribution_amount_default INTEGER DEFAULT NULL,
  installments_per_circle INTEGER DEFAULT NULL,
  funeral_benefit INTEGER DEFAULT NULL,
  sickness_benefit INTEGER DEFAULT NULL,
  loan_interest_percent DECIMAL(5,2) DEFAULT NULL,
  loan_period_days INTEGER DEFAULT NULL,
  grace_period_days INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE circle_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view circle settings for their group
CREATE POLICY "Users can view circle settings for their group" ON circle_settings
  FOR SELECT USING (
    circle_id IN (
      SELECT c.id FROM circles c
      JOIN groups g ON c.group_id = g.id
      JOIN profiles p ON g.id = p.group_id
      WHERE p.id = auth.uid()
    )
  );

-- Policy: Admins can manage circle settings for their group
CREATE POLICY "Admins can manage circle settings for their group" ON circle_settings
  FOR ALL USING (
    circle_id IN (
      SELECT c.id FROM circles c
      JOIN groups g ON c.group_id = g.id
      JOIN profiles p ON g.id = p.group_id
      WHERE p.id = auth.uid() 
      AND p.role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Add indexes for performance
CREATE INDEX idx_circle_settings_circle_id ON circle_settings(circle_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_circle_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_circle_settings_updated_at
  BEFORE UPDATE ON circle_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_circle_settings_updated_at();
