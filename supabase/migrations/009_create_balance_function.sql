-- Create the available_balance RPC function
CREATE OR REPLACE FUNCTION public.available_balance(p_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_balance INTEGER := 0;
    available_balance INTEGER := 0;
    reserve_min_balance INTEGER := 0;
    spendable_balance INTEGER := 0;
    result JSONB;
BEGIN
    -- Get reserve minimum balance from group settings
    SELECT COALESCE(gs.reserve_min_balance, 0)
    INTO reserve_min_balance
    FROM group_settings gs
    WHERE gs.group_id = p_group_id;
    
    -- Calculate total balance from ledger entries
    SELECT COALESCE(SUM(
        CASE 
            WHEN direction = 'IN' THEN amount
            WHEN direction = 'OUT' THEN -amount
            ELSE 0
        END
    ), 0)
    INTO total_balance
    FROM ledger
    WHERE group_id = p_group_id;
    
    -- Calculate available and spendable balances
    available_balance := total_balance;
    spendable_balance := GREATEST(0, total_balance - reserve_min_balance);
    
    -- Build result JSON
    result := jsonb_build_object(
        'available', available_balance,
        'reserve', reserve_min_balance,
        'spendable', spendable_balance,
        'total', total_balance
    );
    
    RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.available_balance(p_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_balance INTEGER := 0;
    available_balance INTEGER := 0;
    reserve_min_balance INTEGER := 0;
    spendable_balance INTEGER := 0;
    result JSONB;
BEGIN
    -- Get reserve minimum balance from group settings
    SELECT COALESCE(gs.reserve_min_balance, 0)
    INTO reserve_min_balance
    FROM group_settings gs
    WHERE gs.group_id = p_group_id;
    
    -- Calculate total balance from ledger entries
    SELECT COALESCE(SUM(
        CASE 
            WHEN direction = 'IN' THEN amount
            WHEN direction = 'OUT' THEN -amount
            ELSE 0
        END
    ), 0)
    INTO total_balance
    FROM ledger
    WHERE group_id = p_group_id;
    
    -- Calculate available and spendable balances
    available_balance := total_balance;
    spendable_balance := GREATEST(0, total_balance - reserve_min_balance);
    
    -- Build result JSON
    result := jsonb_build_object(
        'available', available_balance,
        'reserve', reserve_min_balance,
        'spendable', spendable_balance,
        'total', total_balance
    );
    
    RETURN result;
END;
$$;
