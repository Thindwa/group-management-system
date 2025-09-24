-- Add INSERT policy for loans table
-- Allow authenticated users to insert loans (for loan requests)

CREATE POLICY "Authenticated users can insert loans" ON loans
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Also add UPDATE and DELETE policies for completeness
CREATE POLICY "Authenticated users can update loans" ON loans
    FOR UPDATE TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete loans" ON loans
    FOR DELETE TO authenticated
    USING (auth.uid() IS NOT NULL);
