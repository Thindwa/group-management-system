-- Create trigger function for automatic ledger entry creation when contributions are made
CREATE OR REPLACE FUNCTION create_contribution_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry for PAID contributions
  IF NEW.status = 'PAID' THEN
    INSERT INTO ledger (
      group_id,
      circle_id,
      member_id,
      type,
      ref_id,
      amount,
      direction,
      created_by
    ) VALUES (
      NEW.group_id,
      NEW.circle_id,
      NEW.member_id,
      'CONTRIBUTION_IN',
      NEW.id,
      NEW.contribution_amount_snapshot,
      'IN',
      NEW.member_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_contribution_ledger ON contributions;
CREATE TRIGGER trigger_create_contribution_ledger
  AFTER INSERT OR UPDATE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION create_contribution_ledger_entry();

-- Create trigger function for automatic ledger entry creation when benefits are paid
CREATE OR REPLACE FUNCTION create_benefit_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry for PAID benefits
  IF NEW.status = 'PAID' THEN
    INSERT INTO ledger (
      group_id,
      circle_id,
      member_id,
      type,
      ref_id,
      amount,
      direction,
      created_by
    ) VALUES (
      NEW.group_id,
      NEW.circle_id,
      NEW.member_id,
      'BENEFIT_OUT',
      NEW.id,
      NEW.approved_amount,
      'OUT',
      NEW.approved_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for benefits
DROP TRIGGER IF EXISTS trigger_create_benefit_ledger ON benefits;
CREATE TRIGGER trigger_create_benefit_ledger
  AFTER INSERT OR UPDATE ON benefits
  FOR EACH ROW
  EXECUTE FUNCTION create_benefit_ledger_entry();

-- Create trigger function for automatic ledger entry creation when loans are disbursed
CREATE OR REPLACE FUNCTION create_loan_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry for DISBURSED loans
  IF NEW.status = 'DISBURSED' THEN
    INSERT INTO ledger (
      group_id,
      circle_id,
      member_id,
      type,
      ref_id,
      amount,
      direction,
      created_by
    ) VALUES (
      NEW.group_id,
      NEW.circle_id,
      NEW.member_id,
      'LOAN_OUT',
      NEW.id,
      NEW.principal,
      'OUT',
      NEW.disbursed_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for loans
DROP TRIGGER IF EXISTS trigger_create_loan_ledger ON loans;
CREATE TRIGGER trigger_create_loan_ledger
  AFTER INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION create_loan_ledger_entry();
CREATE OR REPLACE FUNCTION create_contribution_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry for PAID contributions
  IF NEW.status = 'PAID' THEN
    INSERT INTO ledger (
      group_id,
      circle_id,
      member_id,
      type,
      ref_id,
      amount,
      direction,
      created_by
    ) VALUES (
      NEW.group_id,
      NEW.circle_id,
      NEW.member_id,
      'CONTRIBUTION_IN',
      NEW.id,
      NEW.contribution_amount_snapshot,
      'IN',
      NEW.member_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_contribution_ledger ON contributions;
CREATE TRIGGER trigger_create_contribution_ledger
  AFTER INSERT OR UPDATE ON contributions
  FOR EACH ROW
  EXECUTE FUNCTION create_contribution_ledger_entry();

-- Create trigger function for automatic ledger entry creation when benefits are paid
CREATE OR REPLACE FUNCTION create_benefit_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry for PAID benefits
  IF NEW.status = 'PAID' THEN
    INSERT INTO ledger (
      group_id,
      circle_id,
      member_id,
      type,
      ref_id,
      amount,
      direction,
      created_by
    ) VALUES (
      NEW.group_id,
      NEW.circle_id,
      NEW.member_id,
      'BENEFIT_OUT',
      NEW.id,
      NEW.approved_amount,
      'OUT',
      NEW.approved_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for benefits
DROP TRIGGER IF EXISTS trigger_create_benefit_ledger ON benefits;
CREATE TRIGGER trigger_create_benefit_ledger
  AFTER INSERT OR UPDATE ON benefits
  FOR EACH ROW
  EXECUTE FUNCTION create_benefit_ledger_entry();

-- Create trigger function for automatic ledger entry creation when loans are disbursed
CREATE OR REPLACE FUNCTION create_loan_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ledger entry for DISBURSED loans
  IF NEW.status = 'DISBURSED' THEN
    INSERT INTO ledger (
      group_id,
      circle_id,
      member_id,
      type,
      ref_id,
      amount,
      direction,
      created_by
    ) VALUES (
      NEW.group_id,
      NEW.circle_id,
      NEW.member_id,
      'LOAN_OUT',
      NEW.id,
      NEW.principal,
      'OUT',
      NEW.disbursed_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for loans
DROP TRIGGER IF EXISTS trigger_create_loan_ledger ON loans;
CREATE TRIGGER trigger_create_loan_ledger
  AFTER INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION create_loan_ledger_entry();
