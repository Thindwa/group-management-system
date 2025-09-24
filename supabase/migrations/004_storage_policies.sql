-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false)
ON CONFLICT DO NOTHING;

-- Storage policies for receipts bucket
-- Members upload to path `${group_id}/${auth.uid()}/...`
CREATE POLICY "member upload own receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND position( (current_user_group_id())::text || '/' || auth.uid()::text || '/' in name ) = 1
);

-- Members read their own files
CREATE POLICY "member read own receipts" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND position( (current_user_group_id())::text || '/' || auth.uid()::text || '/' in name ) = 1
);

-- Treasurer/Admin read any file in their group
CREATE POLICY "staff read group receipts" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts'
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
  AND position( (current_user_group_id())::text || '/' in name ) = 1
);