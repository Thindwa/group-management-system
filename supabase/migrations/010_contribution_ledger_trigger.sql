-- Create a function to handle inserting into the ledger when contribution status changes to PAID
CREATE OR REPLACE FUNCTION public.handle_contribution_paid_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry when status changes to PAID
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    INSERT INTO public.ledger (group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
    VALUES (NEW.group_id, NEW.circle_id, NEW.member_id, 'CONTRIBUTION_IN', NEW.id, NEW.contribution_amount_snapshot, 'IN', NEW.member_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that fires after an update on the contributions table
DROP TRIGGER IF EXISTS trg_contribution_paid_to_ledger ON public.contributions;
CREATE TRIGGER trg_contribution_paid_to_ledger
  AFTER UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_contribution_paid_to_ledger();
CREATE OR REPLACE FUNCTION public.handle_contribution_paid_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry when status changes to PAID
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    INSERT INTO public.ledger (group_id, circle_id, member_id, type, ref_id, amount, direction, created_by)
    VALUES (NEW.group_id, NEW.circle_id, NEW.member_id, 'CONTRIBUTION_IN', NEW.id, NEW.contribution_amount_snapshot, 'IN', NEW.member_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that fires after an update on the contributions table
DROP TRIGGER IF EXISTS trg_contribution_paid_to_ledger ON public.contributions;
CREATE TRIGGER trg_contribution_paid_to_ledger
  AFTER UPDATE ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_contribution_paid_to_ledger();
