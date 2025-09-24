import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Loan, LoanPayment, GroupSettings, Circle } from '../types';
import { useGroupStore } from './groupStore';
import { computeLoanTotals } from '../services/interest';

interface LoanState {
  // Data
  loans: Loan[];
  pendingLoans: Loan[];
  approvedLoans: Loan[];
  waitlistedLoans: Loan[];
  activeLoans: Loan[];
  disbursableLoans: Loan[];
  closedLoans: Loan[];
  memberLoans: Record<string, Loan[]>;
  loanPayments: Record<string, LoanPayment[]>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadLoans: (groupId: string, circleId: string) => Promise<void>;
  loadMemberLoans: (groupId: string, circleId: string, memberId: string) => Promise<void>;
  loadLoanPayments: (loanId: string) => Promise<void>;
  requestLoan: (loan: Omit<Loan, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  reviewLoan: (loanId: string, action: 'approve' | 'reject', note?: string) => Promise<boolean>;
  disburseLoan: (loanId: string, amount: number, method: string, note?: string) => Promise<boolean>;
  repayLoan: (loanId: string, amount: number, method: string, note?: string) => Promise<boolean>;
  extendGrace: (loanId: string, days: number, reason: string) => Promise<boolean>;
  getWaitlistPosition: (loanId: string) => Promise<number | null>;
  promoteWaitlist: () => Promise<boolean>;
  calculateLoanTotals: (loan: Loan, groupSettings?: GroupSettings, payments?: LoanPayment[]) => any;
  refreshData: () => Promise<void>;
}

export const useLoanStore = create<LoanState>((set, get) => ({
  // Initial state
  loans: [],
  pendingLoans: [],
  approvedLoans: [],
  waitlistedLoans: [],
  activeLoans: [],
  disbursableLoans: [],
  closedLoans: [],
  memberLoans: {},
  loanPayments: {},
  isLoading: false,
  error: null,

  // Load loans for a group and circle
  loadLoans: async (groupId: string, circleId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          borrower:profiles!loans_borrower_id_fkey(full_name, phone),
          disbursed_by_user:profiles!loans_disbursed_by_fkey(full_name, phone)
        `)
        .eq('group_id', groupId)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loans = data || [];
      
      // Categorize loans
      const pendingLoans = loans.filter(l => l.status === 'WAITLISTED');
      const approvedLoans = loans.filter(l => l.status === 'ACTIVE' && !l.disbursed_at);
      const waitlistedLoans = loans.filter(l => l.status === 'WAITLISTED');
      const activeLoans = loans.filter(l => l.status === 'ACTIVE');
      const disbursableLoans = loans.filter(l => l.status === 'ACTIVE' && !l.disbursed_at);
      const closedLoans = loans.filter(l => l.status === 'CLOSED');
      
      set({ 
        loans, 
        pendingLoans, 
        approvedLoans, 
        waitlistedLoans,
        activeLoans,
        disbursableLoans,
        closedLoans,
        isLoading: false 
      });
      
      // Group loans by member
      const memberLoans: Record<string, Loan[]> = {};
      loans.forEach(loan => {
        if (!memberLoans[loan.borrower_id]) {
          memberLoans[loan.borrower_id] = [];
        }
        memberLoans[loan.borrower_id].push(loan);
      });
      
      set({ memberLoans });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load loans for a specific member
  loadMemberLoans: async (groupId: string, circleId: string, memberId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          borrower:profiles!loans_borrower_id_fkey(full_name, phone),
          disbursed_by_user:profiles!loans_disbursed_by_fkey(full_name, phone)
        `)
        .eq('group_id', groupId)
        .eq('circle_id', circleId)
        .eq('borrower_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loans = data || [];
      set({ memberLoans: { ...get().memberLoans, [memberId]: loans }, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load loan payments
  loadLoanPayments: async (loanId: string) => {
    try {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('paid_at', { ascending: false });

      if (error) throw error;

      set({ 
        loanPayments: { 
          ...get().loanPayments, 
          [loanId]: data || [] 
        } 
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Request a new loan
  requestLoan: async (loan: Omit<Loan, 'id' | 'created_at' | 'updated_at'>) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('loans')
        .insert({
          group_id: loan.group_id,
          circle_id: loan.circle_id,
          borrower_id: loan.borrower_id,
          principal: loan.principal,
          status: 'WAITLISTED',
          grace_period_days: loan.grace_period_days,
          grace_source: loan.grace_source,
          notes: loan.notes,
          waitlist_position: loan.waitlist_position,
          waitlisted_at: loan.waitlisted_at || new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Reload loans
      await get().loadLoans(loan.group_id, loan.circle_id);
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Review loan (approve/reject)
  reviewLoan: async (loanId: string, action: 'approve' | 'reject', note?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Reviewing loan with:', { loanId, action, note });
      
      // Get current user ID and role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Only CHAIRPERSON, ADMIN, or SUPERADMIN can approve/reject
      if (!['CHAIRPERSON', 'ADMIN', 'SUPERADMIN'].includes(profile.role)) {
        throw new Error('Only Chairperson, Admin, or Super Admin can approve loans');
      }

      // Update loan status directly
      const { data, error } = await supabase
        .from('loans')
        .update({
          status: action === 'approve' ? 'ACTIVE' : 'CLOSED',
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      console.log('Loan updated successfully:', data);

      // Reload loans
      const { loans } = get();
      const loan = loans.find(l => l.id === loanId);
      if (loan) {
        await get().loadLoans(loan.group_id, loan.circle_id);
      }
      return true;
    } catch (error: any) {
      console.error('Loan review error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Disburse loan
  disburseLoan: async (loanId: string, amount: number, method: string, note?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Disbursing loan:', { loanId, amount, method, note });
      
      // Get current user ID and role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Only TREASURER, ADMIN, or SUPERADMIN can disburse loans
      if (!['TREASURER', 'ADMIN', 'SUPERADMIN'].includes(profile.role)) {
        throw new Error('Only Treasurer, Admin, or Super Admin can disburse loans');
      }

      // Update loan with disbursement details
      const { data, error } = await supabase
        .from('loans')
        .update({
          disbursed_by: user.id,
          disbursed_at: new Date().toISOString(),
          due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          updated_at: new Date().toISOString()
        })
        .eq('id', loanId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      console.log('Loan disbursed successfully:', data);

      // Create ledger entry for loan disbursement
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          group_id: data.group_id,
          circle_id: data.circle_id,
          member_id: data.borrower_id,
          type: 'LOAN_OUT',
          ref_id: data.id,
          amount: amount,
          direction: 'OUT',
          created_by: user.id
        });

      if (ledgerError) {
        console.error('Error creating ledger entry:', ledgerError);
        throw ledgerError;
      }

      // Reload loans and update group balance
      const { loans } = get();
      const loan = loans.find(l => l.id === loanId);
      if (loan) {
        await get().loadLoans(loan.group_id, loan.circle_id);
        // Update group balance
        const groupStore = useGroupStore.getState();
        await groupStore.loadBalance(loan.group_id, loan.circle_id);
      }
      return true;
    } catch (error: any) {
      console.error('Loan disbursement error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Record loan repayment
  repayLoan: async (loanId: string, amount: number, method: string, note?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Recording loan repayment:', { loanId, amount, method, note });
      
      // Get current user ID and role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Only TREASURER, ADMIN, or SUPERADMIN can record repayments
      if (!['TREASURER', 'ADMIN', 'SUPERADMIN'].includes(profile.role)) {
        throw new Error('Only Treasurer, Admin, or Super Admin can record loan repayments');
      }

      // Get loan data first
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('group_id, circle_id, borrower_id')
        .eq('id', loanId)
        .single();

      if (loanError) {
        console.error('Error fetching loan data:', loanError);
        throw loanError;
      }

      // Create loan payment record
      const { data, error } = await supabase
        .from('loan_payments')
        .insert({
          loan_id: loanId,
          amount: amount,
          paid_at: new Date().toISOString(),
          method: method,
          note: note || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Payment creation error:', error);
        throw error;
      }

      console.log('Loan repayment recorded successfully:', data);

      // Create ledger entry for loan repayment
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          group_id: loanData.group_id,
          circle_id: loanData.circle_id,
          member_id: loanData.borrower_id,
          type: 'LOAN_REPAYMENT_IN',
          ref_id: data.id,
          amount: amount,
          direction: 'IN',
          created_by: user.id
        });

      if (ledgerError) {
        console.error('Error creating ledger entry:', ledgerError);
        throw ledgerError;
      }

      // Check if loan is fully repaid and update status if needed
      const { data: updatedLoan, error: fetchLoanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();

      if (fetchLoanError) {
        console.error('Error fetching updated loan:', fetchLoanError);
      } else if (updatedLoan) {
        // Calculate total paid amount including this new payment
        const { data: allPayments, error: paymentsError } = await supabase
          .from('loan_payments')
          .select('amount')
          .eq('loan_id', loanId);

        if (!paymentsError && allPayments) {
          const totalPaid = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
          
          // Calculate total due amount
          const loanTotals = get().calculateLoanTotals(updatedLoan, undefined, allPayments.map(p => ({
            id: '',
            loan_id: loanId,
            amount: p.amount,
            paid_at: new Date().toISOString(),
            method: 'cash' as const,
            note: '',
            created_by: '',
            created_at: new Date().toISOString()
          })));
          
          // If fully repaid, close the loan
          if (loanTotals && totalPaid >= loanTotals.grossDue) {
            const { error: closeError } = await supabase
              .from('loans')
              .update({
                status: 'CLOSED',
                updated_at: new Date().toISOString()
              })
              .eq('id', loanId);

            if (closeError) {
              console.error('Error closing loan:', closeError);
            } else {
              console.log('Loan fully repaid and closed:', loanId);
            }
          }
        }
      }

      // Reload loans, payments, and update group balance
      await get().loadLoans(loanData.group_id, loanData.circle_id);
      await get().loadLoanPayments(loanId);
      // Update group balance
      const groupStore = useGroupStore.getState();
      await groupStore.loadBalance(loanData.group_id, loanData.circle_id);
      return true;
    } catch (error: any) {
      console.error('Loan repayment error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Extend grace period
  extendGrace: async (loanId: string, days: number, reason: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.rpc('rpc_extend_grace', {
        p_loan_id: loanId,
        p_new_grace_days: days,
        p_reason: reason
      });

      if (error) throw error;

      // Reload loans
      const { loans } = get();
      const loan = loans.find(l => l.id === loanId);
      if (loan) {
        await get().loadLoans(loan.group_id, loan.circle_id);
      }
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Get waitlist position
  getWaitlistPosition: async (loanId: string) => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('waitlist_position')
        .eq('id', loanId)
        .single();

      if (error) throw error;
      return data?.waitlist_position || null;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },

  // Promote waitlist
  promoteWaitlist: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { loans } = get();
      if (loans.length === 0) return true;

      const loan = loans[0];
      const { error } = await supabase.rpc('rpc_try_settle_waitlist', {
        p_group_id: loan.group_id,
        p_circle_id: loan.circle_id
      });

      if (error) throw error;

      // Reload loans
      await get().loadLoans(loan.group_id, loan.circle_id);
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Calculate loan totals
  calculateLoanTotals: (loan: Loan, groupSettings?: GroupSettings, payments?: LoanPayment[]) => {
    try {
      const paymentsList = payments || get().loanPayments[loan.id] || [];
      
      // Use group settings if available, otherwise use defaults
      const interestPercent = groupSettings?.loan_interest_percent || 20;
      const loanPeriodDays = groupSettings?.loan_period_days || 30;
      const gracePeriodDays = loan.grace_period_days || groupSettings?.grace_period_days || 0;
      
      // Ensure we have a valid disbursed_at date
      const disbursedAt = loan.disbursed_at || loan.created_at;
      if (!disbursedAt) {
        console.warn('No disbursed_at or created_at date for loan:', loan.id);
        return null;
      }
      
      return computeLoanTotals({
        principal: loan.principal,
        disbursedAt: disbursedAt,
        interestPercent: interestPercent,
        loanPeriodDays: loanPeriodDays,
        gracePeriodDays: gracePeriodDays,
        payments: paymentsList.map(p => ({
          amount: p.amount,
          paidAt: p.paid_at
        }))
      });
    } catch (error) {
      console.error('Error calculating loan totals:', error);
      return null;
    }
  },

  // Refresh all data
  refreshData: async () => {
    const { loans } = get();
    if (loans.length === 0) return;

    const loan = loans[0];
    await get().loadLoans(loan.group_id, loan.circle_id);
  },
}));
