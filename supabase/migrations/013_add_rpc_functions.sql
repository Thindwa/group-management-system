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

-- Available balance helper (for a given group & circle)
CREATE OR REPLACE FUNCTION public.available_balance(p_group_id uuid, p_circle_id uuid)
RETURNS bigint 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT COALESCE(SUM(CASE WHEN direction = 'IN' THEN amount ELSE -amount END), 0)
  FROM ledger
  WHERE group_id = p_group_id AND circle_id = p_circle_id;
$$;

-- Review benefit with balance enforcement (APPROVE/WAITLIST/REJECT)
CREATE OR REPLACE FUNCTION public.rpc_review_benefit(p_benefit_id uuid, p_action text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_benefit benefits%rowtype;
  v_group uuid;
  v_gs group_settings%rowtype;
  v_avail bigint;
  v_spendable bigint;
  v_next_pos int;
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_benefit FROM benefits WHERE id = p_benefit_id; 
  IF v_benefit IS NULL THEN 
    RAISE EXCEPTION 'Benefit not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor;
  IF v_benefit.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Not in your group'; 
  END IF;
  
  SELECT * INTO v_gs FROM group_settings WHERE group_id = v_group;
  v_avail := available_balance(v_group, v_benefit.circle_id);
  v_spendable := v_avail - COALESCE(v_gs.reserve_min_balance,0);

  IF p_action = 'REJECT' THEN
    UPDATE benefits SET status = 'REJECTED', approved_by = v_actor, approved_at = now() WHERE id = p_benefit_id; 
    RETURN;
  END IF;
  
  IF p_action = 'APPROVE' THEN
    IF v_benefit.requested_amount <= v_spendable THEN
      UPDATE benefits SET status = 'APPROVED', approved_by = v_actor, approved_at = now() WHERE id = p_benefit_id; 
      RETURN;
    ELSIF v_gs.auto_waitlist_if_insufficient THEN
      SELECT COALESCE(MAX(waitlist_position),0)+1 INTO v_next_pos FROM benefits WHERE group_id = v_group AND status = 'WAITLISTED';
      UPDATE benefits SET status = 'WAITLISTED', waitlisted_at = now(), waitlist_position = v_next_pos WHERE id = p_benefit_id; 
      RETURN;
    ELSE
      RAISE EXCEPTION 'Insufficient funds: cannot approve';
    END IF;
  END IF;
  
  IF p_action = 'WAITLIST' THEN
    SELECT COALESCE(MAX(waitlist_position),0)+1 INTO v_next_pos FROM benefits WHERE group_id = v_group AND status = 'WAITLISTED';
    UPDATE benefits SET status = 'WAITLISTED', waitlisted_at = now(), waitlist_position = v_next_pos WHERE id = p_benefit_id; 
    RETURN;
  END IF;
  
  RAISE EXCEPTION 'Unknown action %', p_action;
END; 
$$;

-- Review loan with balance enforcement on principal (APPROVE/WAITLIST/REJECT)
CREATE OR REPLACE FUNCTION public.rpc_review_loan(p_loan_id uuid, p_action text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_loan loans%rowtype;
  v_group uuid;
  v_gs group_settings%rowtype;
  v_avail bigint;
  v_spendable bigint;
  v_next_pos int;
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id; 
  IF v_loan IS NULL THEN 
    RAISE EXCEPTION 'Loan not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor;
  IF v_loan.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Not in your group'; 
  END IF;
  
  SELECT * INTO v_gs FROM group_settings WHERE group_id = v_group;
  v_avail := available_balance(v_group, v_loan.circle_id);
  v_spendable := v_avail - COALESCE(v_gs.reserve_min_balance,0);

  IF p_action = 'REJECT' THEN
    UPDATE loans SET status = 'CLOSED', notes = COALESCE(notes,'') || ' [rejected before disbursement]' WHERE id = p_loan_id; 
    RETURN;
  END IF;
  
  IF p_action = 'APPROVE' THEN
    IF v_loan.principal <= v_spendable THEN
      INSERT INTO loan_events(id, loan_id, type, data, actor_id)
      VALUES (gen_random_uuid(), p_loan_id, 'CREATED', jsonb_build_object('approved', true), v_actor); 
      RETURN;
    ELSIF v_gs.auto_waitlist_if_insufficient THEN
      SELECT COALESCE(MAX(waitlist_position),0)+1 INTO v_next_pos FROM loans WHERE group_id = v_group AND status = 'WAITLISTED';
      UPDATE loans SET status = 'WAITLISTED', waitlisted_at = now(), waitlist_position = v_next_pos WHERE id = p_loan_id; 
      RETURN;
    ELSE
      RAISE EXCEPTION 'Insufficient funds: cannot approve';
    END IF;
  END IF;
  
  IF p_action = 'WAITLIST' THEN
    SELECT COALESCE(MAX(waitlist_position),0)+1 INTO v_next_pos FROM loans WHERE group_id = v_group AND status = 'WAITLISTED';
    UPDATE loans SET status = 'WAITLISTED', waitlisted_at = now(), waitlist_position = v_next_pos WHERE id = p_loan_id; 
    RETURN;
  END IF;
  
  RAISE EXCEPTION 'Unknown action %', p_action;
END; 
$$;

-- Auto-promote waitlist when spendable allows
CREATE OR REPLACE FUNCTION public.rpc_try_settle_waitlist(p_group_id uuid, p_circle_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_gs group_settings%rowtype;
  v_spendable bigint;
  v_avail bigint;
  v_item_id uuid;
  v_amount_needed int;
  v_kind text; -- 'BENEFIT' or 'LOAN'
  v_policy text;
BEGIN
  SELECT * INTO v_gs FROM group_settings WHERE group_id = p_group_id;
  v_policy := COALESCE(v_gs.waitlist_policy, 'BENEFITS_FIRST');
  
  LOOP
    v_avail := available_balance(p_group_id, p_circle_id);
    v_spendable := v_avail - COALESCE(v_gs.reserve_min_balance,0);

    IF v_policy = 'BENEFITS_FIRST' THEN
      SELECT id, requested_amount INTO v_item_id, v_amount_needed
      FROM benefits WHERE group_id = p_group_id AND circle_id = p_circle_id AND status = 'WAITLISTED'
      ORDER BY waitlist_position NULLS LAST, requested_at ASC LIMIT 1;
      v_kind := 'BENEFIT';
    ELSIF v_policy = 'LOANS_FIRST' THEN
      SELECT id, principal INTO v_item_id, v_amount_needed
      FROM loans WHERE group_id = p_group_id AND circle_id = p_circle_id AND status = 'WAITLISTED'
      ORDER BY waitlist_position NULLS LAST, disbursed_at ASC NULLS LAST LIMIT 1;
      v_kind := 'LOAN';
    ELSE
      WITH unionq AS (
        SELECT id, requested_amount as amt, requested_at as ts, 'BENEFIT' as kind
          FROM benefits WHERE group_id = p_group_id AND circle_id = p_circle_id AND status = 'WAITLISTED'
        UNION ALL
        SELECT id, principal as amt, COALESCE(disbursed_at, now()) as ts, 'LOAN' as kind
          FROM loans WHERE group_id = p_group_id AND circle_id = p_circle_id AND status = 'WAITLISTED'
      )
      SELECT id, amt, kind INTO v_item_id, v_amount_needed, v_kind FROM unionq ORDER BY ts ASC LIMIT 1;
    END IF;

    EXIT WHEN v_item_id IS NULL OR v_amount_needed IS NULL;
    
    IF v_amount_needed <= v_spendable THEN
      IF v_kind = 'BENEFIT' THEN
        UPDATE benefits SET status = 'APPROVED', approved_by = auth.uid(), approved_at = now() WHERE id = v_item_id;
      ELSE
        UPDATE loans SET status = 'ACTIVE', notes = COALESCE(notes,'') || ' [auto-approved]' WHERE id = v_item_id;
      END IF;
      CONTINUE; -- try to settle next
    END IF;
    EXIT; -- cannot settle more with current spendable
  END LOOP;
END; 
$$;

-- Make contribution + ledger
CREATE OR REPLACE FUNCTION public.rpc_make_contribution(
  p_member_id uuid, p_circle_id uuid, p_period_index int, p_amount int,
  p_method text, p_note text default '', p_attachment_url text default null
) RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_group_id uuid; 
  v_contribution_id uuid := gen_random_uuid(); 
  v_created_by uuid := auth.uid();
  v_amount_snapshot int; 
  v_planned_installments int; 
  v_circle_group uuid;
BEGIN
  SELECT group_id INTO v_group_id FROM profiles WHERE id = v_created_by; 
  IF v_group_id IS NULL THEN 
    RAISE EXCEPTION 'No group'; 
  END IF;
  
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT group_id INTO v_circle_group FROM circles WHERE id = p_circle_id; 
  IF v_circle_group IS DISTINCT FROM v_group_id THEN 
    RAISE EXCEPTION 'Circle mismatch'; 
  END IF;
  
  SELECT contribution_amount_default INTO v_amount_snapshot FROM group_settings WHERE group_id = v_group_id;
  SELECT CASE 
    WHEN contribution_strategy = 'INSTALLMENTS_PER_CIRCLE' THEN installments_per_circle 
    WHEN contribution_strategy = 'MONTHLY' THEN 12 
    ELSE GREATEST(1, FLOOR(circle_duration_days / GREATEST(1, contribution_interval_days))) 
  END INTO v_planned_installments 
  FROM group_settings WHERE group_id = v_group_id;
  
  INSERT INTO contributions(id, group_id, circle_id, member_id, period_index, planned_installments, amount, method, note, attachment_url, contribution_amount_snapshot, created_by)
  VALUES (v_contribution_id, v_group_id, p_circle_id, p_member_id, p_period_index, v_planned_installments, p_amount, p_method, p_note, p_attachment_url, v_amount_snapshot, v_created_by);
  
  INSERT INTO ledger(id, group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
  VALUES (gen_random_uuid(), v_group_id, p_circle_id, p_member_id, 'CONTRIBUTION_IN', v_contribution_id, p_amount, 'IN', v_created_by);
  
  RETURN v_contribution_id;
END; 
$$;

-- Pay benefit + ledger
CREATE OR REPLACE FUNCTION public.rpc_pay_benefit(p_benefit_id uuid, p_paid_amount int, p_method text default 'cash', p_note text default '')
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_group uuid; 
  v_actor uuid := auth.uid(); 
  v_benefit record; 
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_benefit FROM benefits WHERE id = p_benefit_id; 
  IF v_benefit IS NULL THEN 
    RAISE EXCEPTION 'Benefit not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor; 
  IF v_benefit.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Group mismatch'; 
  END IF;
  
  UPDATE benefits SET status='PAID', paid_by = v_actor, paid_at = now() WHERE id = p_benefit_id;
  
  INSERT INTO ledger(id, group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
  VALUES (gen_random_uuid(), v_group, v_benefit.circle_id, v_benefit.member_id, 'BENEFIT_OUT', p_benefit_id, p_paid_amount, 'OUT', v_actor);
END; 
$$;

-- Disburse loan + ledger + event
CREATE OR REPLACE FUNCTION public.rpc_disburse_loan(p_loan_id uuid, p_disbursed_at timestamptz default now())
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_group uuid; 
  v_actor uuid := auth.uid(); 
  v_gs record; 
  v_loan record; 
  v_due timestamptz; 
  v_grace int; 
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id; 
  IF v_loan IS NULL THEN 
    RAISE EXCEPTION 'Loan not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor; 
  IF v_loan.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Group mismatch'; 
  END IF;
  
  SELECT * INTO v_gs FROM group_settings WHERE group_id = v_group;
  v_due := p_disbursed_at + make_interval(days => v_gs.loan_period_days);
  v_grace := COALESCE(v_loan.grace_period_days, v_gs.grace_period_days);
  
  UPDATE loans SET disbursed_at = p_disbursed_at, due_at = v_due, status='ACTIVE' WHERE id = p_loan_id;
  
  INSERT INTO ledger(id, group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
  VALUES (gen_random_uuid(), v_group, v_loan.circle_id, v_loan.borrower_id, 'LOAN_OUT', p_loan_id, v_loan.principal, 'OUT', v_actor);
  
  INSERT INTO loan_events(id, loan_id, type, data, actor_id)
  VALUES (gen_random_uuid(), p_loan_id, 'DISBURSED', jsonb_build_object('disbursed_at', p_disbursed_at, 'due_at', v_due, 'grace_days', v_grace), v_actor);
END; 
$$;

-- Repay loan + ledger
CREATE OR REPLACE FUNCTION public.rpc_repay_loan(p_loan_id uuid, p_amount int, p_paid_at timestamptz default now(), p_method text default 'cash', p_note text default '')
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_group uuid; 
  v_actor uuid := auth.uid(); 
  v_loan record; 
  v_payment uuid := gen_random_uuid(); 
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id; 
  IF v_loan IS NULL THEN 
    RAISE EXCEPTION 'Loan not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor; 
  IF v_loan.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Group mismatch'; 
  END IF;
  
  INSERT INTO loan_payments(id, loan_id, amount, paid_at, method, note) 
  VALUES (v_payment, p_loan_id, p_amount, p_paid_at, p_method, p_note);
  
  INSERT INTO ledger(id, group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
  VALUES (gen_random_uuid(), v_group, v_loan.circle_id, v_loan.borrower_id, 'LOAN_REPAYMENT_IN', v_payment, p_amount, 'IN', v_actor);
  
  RETURN v_payment;
END; 
$$;

-- Extend grace on a loan
CREATE OR REPLACE FUNCTION public.rpc_extend_grace(p_loan_id uuid, p_new_grace_days int, p_reason text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_group uuid; 
  v_actor uuid := auth.uid(); 
  v_loan record; 
  v_old int; 
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id; 
  IF v_loan IS NULL THEN 
    RAISE EXCEPTION 'Loan not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor; 
  IF v_loan.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Group mismatch'; 
  END IF;
  
  v_old := COALESCE(v_loan.grace_period_days, 0);
  
  UPDATE loans SET grace_period_days = p_new_grace_days, grace_source='ADJUSTED', grace_adjusted_by=v_actor, grace_adjusted_at=now() WHERE id = p_loan_id;
  
  INSERT INTO loan_events(id, loan_id, type, data, actor_id) 
  VALUES (gen_random_uuid(), p_loan_id, 'GRACE_EXTENDED', jsonb_build_object('old', v_old, 'new', p_new_grace_days, 'reason', p_reason), v_actor);
  
  INSERT INTO audit_log(id, actor_id, action, entity, entity_id, payload) 
  VALUES (gen_random_uuid(), v_actor, 'GRACE_EXTENDED', 'loan', p_loan_id, jsonb_build_object('old', v_old, 'new', p_new_grace_days, 'reason', p_reason));
END; 
$$;

-- Optional: after IN ledger insert, try to settle waitlist
CREATE OR REPLACE FUNCTION public.post_ledger_try_waitlist()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  IF (tg_op = 'INSERT' AND new.direction = 'IN') THEN
    PERFORM public.rpc_try_settle_waitlist(new.group_id, new.circle_id);
  END IF;
  RETURN new;
END; 
$$;

DROP TRIGGER IF EXISTS trg_post_ledger_try_waitlist ON ledger;
CREATE TRIGGER trg_post_ledger_try_waitlist
  AFTER INSERT ON ledger
  FOR EACH ROW EXECUTE PROCEDURE public.post_ledger_try_waitlist();
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

-- Available balance helper (for a given group & circle)
CREATE OR REPLACE FUNCTION public.available_balance(p_group_id uuid, p_circle_id uuid)
RETURNS bigint 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT COALESCE(SUM(CASE WHEN direction = 'IN' THEN amount ELSE -amount END), 0)
  FROM ledger
  WHERE group_id = p_group_id AND circle_id = p_circle_id;
$$;

-- Review benefit with balance enforcement (APPROVE/WAITLIST/REJECT)
CREATE OR REPLACE FUNCTION public.rpc_review_benefit(p_benefit_id uuid, p_action text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_benefit benefits%rowtype;
  v_group uuid;
  v_gs group_settings%rowtype;
  v_avail bigint;
  v_spendable bigint;
  v_next_pos int;
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_benefit FROM benefits WHERE id = p_benefit_id; 
  IF v_benefit IS NULL THEN 
    RAISE EXCEPTION 'Benefit not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor;
  IF v_benefit.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Not in your group'; 
  END IF;
  
  SELECT * INTO v_gs FROM group_settings WHERE group_id = v_group;
  v_avail := available_balance(v_group, v_benefit.circle_id);
  v_spendable := v_avail - COALESCE(v_gs.reserve_min_balance,0);

  IF p_action = 'REJECT' THEN
    UPDATE benefits SET status = 'REJECTED', approved_by = v_actor, approved_at = now() WHERE id = p_benefit_id; 
    RETURN;
  END IF;
  
  IF p_action = 'APPROVE' THEN
    IF v_benefit.requested_amount <= v_spendable THEN
      UPDATE benefits SET status = 'APPROVED', approved_by = v_actor, approved_at = now() WHERE id = p_benefit_id; 
      RETURN;
    ELSIF v_gs.auto_waitlist_if_insufficient THEN
      SELECT COALESCE(MAX(waitlist_position),0)+1 INTO v_next_pos FROM benefits WHERE group_id = v_group AND status = 'WAITLISTED';
      UPDATE benefits SET status = 'WAITLISTED', waitlisted_at = now(), waitlist_position = v_next_pos WHERE id = p_benefit_id; 
      RETURN;
    ELSE
      RAISE EXCEPTION 'Insufficient funds: cannot approve';
    END IF;
  END IF;
  
  IF p_action = 'WAITLIST' THEN
    SELECT COALESCE(MAX(waitlist_position),0)+1 INTO v_next_pos FROM benefits WHERE group_id = v_group AND status = 'WAITLISTED';
    UPDATE benefits SET status = 'WAITLISTED', waitlisted_at = now(), waitlist_position = v_next_pos WHERE id = p_benefit_id; 
    RETURN;
  END IF;
  
  RAISE EXCEPTION 'Unknown action %', p_action;
END; 
$$;

-- Review loan with balance enforcement on principal (APPROVE/WAITLIST/REJECT)
CREATE OR REPLACE FUNCTION public.rpc_review_loan(p_loan_id uuid, p_action text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_loan loans%rowtype;
  v_group uuid;
  v_gs group_settings%rowtype;
  v_avail bigint;
  v_spendable bigint;
  v_next_pos int;
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id; 
  IF v_loan IS NULL THEN 
    RAISE EXCEPTION 'Loan not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor;
  IF v_loan.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Not in your group'; 
  END IF;
  
  SELECT * INTO v_gs FROM group_settings WHERE group_id = v_group;
  v_avail := available_balance(v_group, v_loan.circle_id);
  v_spendable := v_avail - COALESCE(v_gs.reserve_min_balance,0);

  IF p_action = 'REJECT' THEN
    UPDATE loans SET status = 'CLOSED', notes = COALESCE(notes,'') || ' [rejected before disbursement]' WHERE id = p_loan_id; 
    RETURN;
  END IF;
  
  IF p_action = 'APPROVE' THEN
    IF v_loan.principal <= v_spendable THEN
      INSERT INTO loan_events(id, loan_id, type, data, actor_id)
      VALUES (gen_random_uuid(), p_loan_id, 'CREATED', jsonb_build_object('approved', true), v_actor); 
      RETURN;
    ELSIF v_gs.auto_waitlist_if_insufficient THEN
      SELECT COALESCE(MAX(waitlist_position),0)+1 INTO v_next_pos FROM loans WHERE group_id = v_group AND status = 'WAITLISTED';
      UPDATE loans SET status = 'WAITLISTED', waitlisted_at = now(), waitlist_position = v_next_pos WHERE id = p_loan_id; 
      RETURN;
    ELSE
      RAISE EXCEPTION 'Insufficient funds: cannot approve';
    END IF;
  END IF;
  
  IF p_action = 'WAITLIST' THEN
    SELECT COALESCE(MAX(waitlist_position),0)+1 INTO v_next_pos FROM loans WHERE group_id = v_group AND status = 'WAITLISTED';
    UPDATE loans SET status = 'WAITLISTED', waitlisted_at = now(), waitlist_position = v_next_pos WHERE id = p_loan_id; 
    RETURN;
  END IF;
  
  RAISE EXCEPTION 'Unknown action %', p_action;
END; 
$$;

-- Auto-promote waitlist when spendable allows
CREATE OR REPLACE FUNCTION public.rpc_try_settle_waitlist(p_group_id uuid, p_circle_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_gs group_settings%rowtype;
  v_spendable bigint;
  v_avail bigint;
  v_item_id uuid;
  v_amount_needed int;
  v_kind text; -- 'BENEFIT' or 'LOAN'
  v_policy text;
BEGIN
  SELECT * INTO v_gs FROM group_settings WHERE group_id = p_group_id;
  v_policy := COALESCE(v_gs.waitlist_policy, 'BENEFITS_FIRST');
  
  LOOP
    v_avail := available_balance(p_group_id, p_circle_id);
    v_spendable := v_avail - COALESCE(v_gs.reserve_min_balance,0);

    IF v_policy = 'BENEFITS_FIRST' THEN
      SELECT id, requested_amount INTO v_item_id, v_amount_needed
      FROM benefits WHERE group_id = p_group_id AND circle_id = p_circle_id AND status = 'WAITLISTED'
      ORDER BY waitlist_position NULLS LAST, requested_at ASC LIMIT 1;
      v_kind := 'BENEFIT';
    ELSIF v_policy = 'LOANS_FIRST' THEN
      SELECT id, principal INTO v_item_id, v_amount_needed
      FROM loans WHERE group_id = p_group_id AND circle_id = p_circle_id AND status = 'WAITLISTED'
      ORDER BY waitlist_position NULLS LAST, disbursed_at ASC NULLS LAST LIMIT 1;
      v_kind := 'LOAN';
    ELSE
      WITH unionq AS (
        SELECT id, requested_amount as amt, requested_at as ts, 'BENEFIT' as kind
          FROM benefits WHERE group_id = p_group_id AND circle_id = p_circle_id AND status = 'WAITLISTED'
        UNION ALL
        SELECT id, principal as amt, COALESCE(disbursed_at, now()) as ts, 'LOAN' as kind
          FROM loans WHERE group_id = p_group_id AND circle_id = p_circle_id AND status = 'WAITLISTED'
      )
      SELECT id, amt, kind INTO v_item_id, v_amount_needed, v_kind FROM unionq ORDER BY ts ASC LIMIT 1;
    END IF;

    EXIT WHEN v_item_id IS NULL OR v_amount_needed IS NULL;
    
    IF v_amount_needed <= v_spendable THEN
      IF v_kind = 'BENEFIT' THEN
        UPDATE benefits SET status = 'APPROVED', approved_by = auth.uid(), approved_at = now() WHERE id = v_item_id;
      ELSE
        UPDATE loans SET status = 'ACTIVE', notes = COALESCE(notes,'') || ' [auto-approved]' WHERE id = v_item_id;
      END IF;
      CONTINUE; -- try to settle next
    END IF;
    EXIT; -- cannot settle more with current spendable
  END LOOP;
END; 
$$;

-- Make contribution + ledger
CREATE OR REPLACE FUNCTION public.rpc_make_contribution(
  p_member_id uuid, p_circle_id uuid, p_period_index int, p_amount int,
  p_method text, p_note text default '', p_attachment_url text default null
) RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_group_id uuid; 
  v_contribution_id uuid := gen_random_uuid(); 
  v_created_by uuid := auth.uid();
  v_amount_snapshot int; 
  v_planned_installments int; 
  v_circle_group uuid;
BEGIN
  SELECT group_id INTO v_group_id FROM profiles WHERE id = v_created_by; 
  IF v_group_id IS NULL THEN 
    RAISE EXCEPTION 'No group'; 
  END IF;
  
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT group_id INTO v_circle_group FROM circles WHERE id = p_circle_id; 
  IF v_circle_group IS DISTINCT FROM v_group_id THEN 
    RAISE EXCEPTION 'Circle mismatch'; 
  END IF;
  
  SELECT contribution_amount_default INTO v_amount_snapshot FROM group_settings WHERE group_id = v_group_id;
  SELECT CASE 
    WHEN contribution_strategy = 'INSTALLMENTS_PER_CIRCLE' THEN installments_per_circle 
    WHEN contribution_strategy = 'MONTHLY' THEN 12 
    ELSE GREATEST(1, FLOOR(circle_duration_days / GREATEST(1, contribution_interval_days))) 
  END INTO v_planned_installments 
  FROM group_settings WHERE group_id = v_group_id;
  
  INSERT INTO contributions(id, group_id, circle_id, member_id, period_index, planned_installments, amount, method, note, attachment_url, contribution_amount_snapshot, created_by)
  VALUES (v_contribution_id, v_group_id, p_circle_id, p_member_id, p_period_index, v_planned_installments, p_amount, p_method, p_note, p_attachment_url, v_amount_snapshot, v_created_by);
  
  INSERT INTO ledger(id, group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
  VALUES (gen_random_uuid(), v_group_id, p_circle_id, p_member_id, 'CONTRIBUTION_IN', v_contribution_id, p_amount, 'IN', v_created_by);
  
  RETURN v_contribution_id;
END; 
$$;

-- Pay benefit + ledger
CREATE OR REPLACE FUNCTION public.rpc_pay_benefit(p_benefit_id uuid, p_paid_amount int, p_method text default 'cash', p_note text default '')
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_group uuid; 
  v_actor uuid := auth.uid(); 
  v_benefit record; 
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_benefit FROM benefits WHERE id = p_benefit_id; 
  IF v_benefit IS NULL THEN 
    RAISE EXCEPTION 'Benefit not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor; 
  IF v_benefit.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Group mismatch'; 
  END IF;
  
  UPDATE benefits SET status='PAID', paid_by = v_actor, paid_at = now() WHERE id = p_benefit_id;
  
  INSERT INTO ledger(id, group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
  VALUES (gen_random_uuid(), v_group, v_benefit.circle_id, v_benefit.member_id, 'BENEFIT_OUT', p_benefit_id, p_paid_amount, 'OUT', v_actor);
END; 
$$;

-- Disburse loan + ledger + event
CREATE OR REPLACE FUNCTION public.rpc_disburse_loan(p_loan_id uuid, p_disbursed_at timestamptz default now())
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_group uuid; 
  v_actor uuid := auth.uid(); 
  v_gs record; 
  v_loan record; 
  v_due timestamptz; 
  v_grace int; 
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id; 
  IF v_loan IS NULL THEN 
    RAISE EXCEPTION 'Loan not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor; 
  IF v_loan.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Group mismatch'; 
  END IF;
  
  SELECT * INTO v_gs FROM group_settings WHERE group_id = v_group;
  v_due := p_disbursed_at + make_interval(days => v_gs.loan_period_days);
  v_grace := COALESCE(v_loan.grace_period_days, v_gs.grace_period_days);
  
  UPDATE loans SET disbursed_at = p_disbursed_at, due_at = v_due, status='ACTIVE' WHERE id = p_loan_id;
  
  INSERT INTO ledger(id, group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
  VALUES (gen_random_uuid(), v_group, v_loan.circle_id, v_loan.borrower_id, 'LOAN_OUT', p_loan_id, v_loan.principal, 'OUT', v_actor);
  
  INSERT INTO loan_events(id, loan_id, type, data, actor_id)
  VALUES (gen_random_uuid(), p_loan_id, 'DISBURSED', jsonb_build_object('disbursed_at', p_disbursed_at, 'due_at', v_due, 'grace_days', v_grace), v_actor);
END; 
$$;

-- Repay loan + ledger
CREATE OR REPLACE FUNCTION public.rpc_repay_loan(p_loan_id uuid, p_amount int, p_paid_at timestamptz default now(), p_method text default 'cash', p_note text default '')
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_group uuid; 
  v_actor uuid := auth.uid(); 
  v_loan record; 
  v_payment uuid := gen_random_uuid(); 
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','TREASURER']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id; 
  IF v_loan IS NULL THEN 
    RAISE EXCEPTION 'Loan not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor; 
  IF v_loan.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Group mismatch'; 
  END IF;
  
  INSERT INTO loan_payments(id, loan_id, amount, paid_at, method, note) 
  VALUES (v_payment, p_loan_id, p_amount, p_paid_at, p_method, p_note);
  
  INSERT INTO ledger(id, group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
  VALUES (gen_random_uuid(), v_group, v_loan.circle_id, v_loan.borrower_id, 'LOAN_REPAYMENT_IN', v_payment, p_amount, 'IN', v_actor);
  
  RETURN v_payment;
END; 
$$;

-- Extend grace on a loan
CREATE OR REPLACE FUNCTION public.rpc_extend_grace(p_loan_id uuid, p_new_grace_days int, p_reason text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_group uuid; 
  v_actor uuid := auth.uid(); 
  v_loan record; 
  v_old int; 
BEGIN
  IF NOT has_role(ARRAY['SUPERADMIN','ADMIN','CHAIRPERSON']) THEN 
    RAISE EXCEPTION 'Not allowed'; 
  END IF;
  
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id; 
  IF v_loan IS NULL THEN 
    RAISE EXCEPTION 'Loan not found'; 
  END IF;
  
  SELECT group_id INTO v_group FROM profiles WHERE id = v_actor; 
  IF v_loan.group_id IS DISTINCT FROM v_group THEN 
    RAISE EXCEPTION 'Group mismatch'; 
  END IF;
  
  v_old := COALESCE(v_loan.grace_period_days, 0);
  
  UPDATE loans SET grace_period_days = p_new_grace_days, grace_source='ADJUSTED', grace_adjusted_by=v_actor, grace_adjusted_at=now() WHERE id = p_loan_id;
  
  INSERT INTO loan_events(id, loan_id, type, data, actor_id) 
  VALUES (gen_random_uuid(), p_loan_id, 'GRACE_EXTENDED', jsonb_build_object('old', v_old, 'new', p_new_grace_days, 'reason', p_reason), v_actor);
  
  INSERT INTO audit_log(id, actor_id, action, entity, entity_id, payload) 
  VALUES (gen_random_uuid(), v_actor, 'GRACE_EXTENDED', 'loan', p_loan_id, jsonb_build_object('old', v_old, 'new', p_new_grace_days, 'reason', p_reason));
END; 
$$;

-- Optional: after IN ledger insert, try to settle waitlist
CREATE OR REPLACE FUNCTION public.post_ledger_try_waitlist()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  IF (tg_op = 'INSERT' AND new.direction = 'IN') THEN
    PERFORM public.rpc_try_settle_waitlist(new.group_id, new.circle_id);
  END IF;
  RETURN new;
END; 
$$;

DROP TRIGGER IF EXISTS trg_post_ledger_try_waitlist ON ledger;
CREATE TRIGGER trg_post_ledger_try_waitlist
  AFTER INSERT ON ledger
  FOR EACH ROW EXECUTE PROCEDURE public.post_ledger_try_waitlist();
