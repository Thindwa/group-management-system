-- Profiles policies
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
CREATE POLICY "read own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "update own profile" ON public.profiles;
CREATE POLICY "update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "group read for admins" ON public.profiles;
CREATE POLICY "group read for admins"
ON public.profiles FOR SELECT
USING (
  has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER','CHAIRPERSON','AUDITOR'])
  AND group_id = current_user_group_id()
);

-- Groups policies
DROP POLICY IF EXISTS "read own group" ON public.groups;
CREATE POLICY "read own group"
ON public.groups FOR SELECT
USING (id = current_user_group_id());

DROP POLICY IF EXISTS "create groups" ON public.groups;
CREATE POLICY "create groups"
ON public.groups FOR INSERT
WITH CHECK (has_role(ARRAY['SUPERADMIN']));

-- Group settings policies
DROP POLICY IF EXISTS "read group settings" ON public.group_settings;
CREATE POLICY "read group settings"
ON public.group_settings FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "manage group settings" ON public.group_settings;
CREATE POLICY "manage group settings"
ON public.group_settings FOR ALL
USING (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
);

-- Member settings policies
DROP POLICY IF EXISTS "read member settings" ON public.member_settings;
CREATE POLICY "read member settings"
ON public.member_settings FOR SELECT
USING (
  member_id = auth.uid()
  OR (has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) AND member_id IN (
    SELECT id FROM profiles WHERE group_id = current_user_group_id()
  ))
);

DROP POLICY IF EXISTS "manage member settings" ON public.member_settings;
CREATE POLICY "manage member settings"
ON public.member_settings FOR ALL
USING (
  has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
  AND member_id IN (
    SELECT id FROM profiles WHERE group_id = current_user_group_id()
  )
);

-- Circles policies
DROP POLICY IF EXISTS "read circles" ON public.circles;
CREATE POLICY "read circles"
ON public.circles FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "manage circles" ON public.circles;
CREATE POLICY "manage circles"
ON public.circles FOR ALL
USING (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
);

-- Contributions policies
DROP POLICY IF EXISTS "group read contributions" ON public.contributions;
CREATE POLICY "group read contributions"
ON public.contributions FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "treasurer create contributions" ON public.contributions;
CREATE POLICY "treasurer create contributions"
ON public.contributions FOR INSERT
WITH CHECK (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
);

-- Benefits policies
DROP POLICY IF EXISTS "group read benefits" ON public.benefits;
CREATE POLICY "group read benefits"
ON public.benefits FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "create benefits" ON public.benefits;
CREATE POLICY "create benefits"
ON public.benefits FOR INSERT
WITH CHECK (
  group_id = current_user_group_id()
  AND member_id = auth.uid()
);

DROP POLICY IF EXISTS "approve or pay benefits" ON public.benefits;
CREATE POLICY "approve or pay benefits"
ON public.benefits FOR UPDATE
USING (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON','TREASURER'])
);

-- Loans policies
DROP POLICY IF EXISTS "group read loans" ON public.loans;
CREATE POLICY "group read loans"
ON public.loans FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "manage loans insert" ON public.loans;
CREATE POLICY "manage loans insert"
ON public.loans FOR INSERT
WITH CHECK (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON','TREASURER'])
);

DROP POLICY IF EXISTS "manage loans update" ON public.loans;
CREATE POLICY "manage loans update"
ON public.loans FOR UPDATE
USING (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON','TREASURER'])
);

-- Loan payments policies
DROP POLICY IF EXISTS "group read loan payments" ON public.loan_payments;
CREATE POLICY "group read loan payments"
ON public.loan_payments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.loans l WHERE l.id = loan_id AND l.group_id = current_user_group_id()
));

DROP POLICY IF EXISTS "treasurer pays loan" ON public.loan_payments;
CREATE POLICY "treasurer pays loan"
ON public.loan_payments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.loans l
  WHERE l.id = loan_id
    AND l.group_id = current_user_group_id()
) AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']));

-- Loan events policies
CREATE POLICY "group read loan events"
ON public.loan_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.loans l WHERE l.id = loan_id AND l.group_id = current_user_group_id()
));

CREATE POLICY "write loan events"
ON public.loan_events FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.loans l WHERE l.id = loan_id AND l.group_id = current_user_group_id()
) AND has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON','TREASURER']));

-- Ledger policies
DROP POLICY IF EXISTS "group read ledger" ON public.ledger;
CREATE POLICY "group read ledger"
ON public.ledger FOR SELECT
USING (group_id = current_user_group_id());

CREATE POLICY "write ledger"
ON public.ledger FOR INSERT
WITH CHECK (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
);

-- Audit log policies
CREATE POLICY "read audit log"
ON public.audit_log FOR SELECT
USING (
  actor_id = auth.uid()
  OR (has_role(ARRAY['SUPERADMIN','ADMIN','AUDITOR']) AND actor_id IN (
    SELECT id FROM profiles WHERE group_id = current_user_group_id()
  ))
);

CREATE POLICY "read own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "update own profile" ON public.profiles;
CREATE POLICY "update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "group read for admins" ON public.profiles;
CREATE POLICY "group read for admins"
ON public.profiles FOR SELECT
USING (
  has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER','CHAIRPERSON','AUDITOR'])
  AND group_id = current_user_group_id()
);

-- Groups policies
DROP POLICY IF EXISTS "read own group" ON public.groups;
CREATE POLICY "read own group"
ON public.groups FOR SELECT
USING (id = current_user_group_id());

DROP POLICY IF EXISTS "create groups" ON public.groups;
CREATE POLICY "create groups"
ON public.groups FOR INSERT
WITH CHECK (has_role(ARRAY['SUPERADMIN']));

-- Group settings policies
DROP POLICY IF EXISTS "read group settings" ON public.group_settings;
CREATE POLICY "read group settings"
ON public.group_settings FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "manage group settings" ON public.group_settings;
CREATE POLICY "manage group settings"
ON public.group_settings FOR ALL
USING (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
);

-- Member settings policies
DROP POLICY IF EXISTS "read member settings" ON public.member_settings;
CREATE POLICY "read member settings"
ON public.member_settings FOR SELECT
USING (
  member_id = auth.uid()
  OR (has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) AND member_id IN (
    SELECT id FROM profiles WHERE group_id = current_user_group_id()
  ))
);

DROP POLICY IF EXISTS "manage member settings" ON public.member_settings;
CREATE POLICY "manage member settings"
ON public.member_settings FOR ALL
USING (
  has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
  AND member_id IN (
    SELECT id FROM profiles WHERE group_id = current_user_group_id()
  )
);

-- Circles policies
DROP POLICY IF EXISTS "read circles" ON public.circles;
CREATE POLICY "read circles"
ON public.circles FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "manage circles" ON public.circles;
CREATE POLICY "manage circles"
ON public.circles FOR ALL
USING (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
);

-- Contributions policies
DROP POLICY IF EXISTS "group read contributions" ON public.contributions;
CREATE POLICY "group read contributions"
ON public.contributions FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "treasurer create contributions" ON public.contributions;
CREATE POLICY "treasurer create contributions"
ON public.contributions FOR INSERT
WITH CHECK (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
);

-- Benefits policies
DROP POLICY IF EXISTS "group read benefits" ON public.benefits;
CREATE POLICY "group read benefits"
ON public.benefits FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "create benefits" ON public.benefits;
CREATE POLICY "create benefits"
ON public.benefits FOR INSERT
WITH CHECK (
  group_id = current_user_group_id()
  AND member_id = auth.uid()
);

DROP POLICY IF EXISTS "approve or pay benefits" ON public.benefits;
CREATE POLICY "approve or pay benefits"
ON public.benefits FOR UPDATE
USING (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON','TREASURER'])
);

-- Loans policies
DROP POLICY IF EXISTS "group read loans" ON public.loans;
CREATE POLICY "group read loans"
ON public.loans FOR SELECT
USING (group_id = current_user_group_id());

DROP POLICY IF EXISTS "manage loans insert" ON public.loans;
CREATE POLICY "manage loans insert"
ON public.loans FOR INSERT
WITH CHECK (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON','TREASURER'])
);

DROP POLICY IF EXISTS "manage loans update" ON public.loans;
CREATE POLICY "manage loans update"
ON public.loans FOR UPDATE
USING (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON','TREASURER'])
);

-- Loan payments policies
DROP POLICY IF EXISTS "group read loan payments" ON public.loan_payments;
CREATE POLICY "group read loan payments"
ON public.loan_payments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.loans l WHERE l.id = loan_id AND l.group_id = current_user_group_id()
));

DROP POLICY IF EXISTS "treasurer pays loan" ON public.loan_payments;
CREATE POLICY "treasurer pays loan"
ON public.loan_payments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.loans l
  WHERE l.id = loan_id
    AND l.group_id = current_user_group_id()
) AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']));

-- Loan events policies
CREATE POLICY "group read loan events"
ON public.loan_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.loans l WHERE l.id = loan_id AND l.group_id = current_user_group_id()
));

CREATE POLICY "write loan events"
ON public.loan_events FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.loans l WHERE l.id = loan_id AND l.group_id = current_user_group_id()
) AND has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON','TREASURER']));

-- Ledger policies
DROP POLICY IF EXISTS "group read ledger" ON public.ledger;
CREATE POLICY "group read ledger"
ON public.ledger FOR SELECT
USING (group_id = current_user_group_id());

CREATE POLICY "write ledger"
ON public.ledger FOR INSERT
WITH CHECK (
  group_id = current_user_group_id()
  AND has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER'])
);

-- Audit log policies
CREATE POLICY "read audit log"
ON public.audit_log FOR SELECT
USING (
  actor_id = auth.uid()
  OR (has_role(ARRAY['SUPERADMIN','ADMIN','AUDITOR']) AND actor_id IN (
    SELECT id FROM profiles WHERE group_id = current_user_group_id()
  ))
);
