import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Contribution, GroupSettings, Circle } from '../types';
import { computePlannedInstallments, currentPeriodIndex } from '../services/schedule';
import { useGroupStore } from './groupStore';

interface ContributionState {
  // Data
  contributions: Contribution[];
  plannedInstallments: string[];
  currentPeriodIndex: number;
  memberContributions: Record<string, Contribution[]>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadContributions: (groupId: string, circleId: string) => Promise<void>;
  loadMemberContributions: (groupId: string, circleId: string, memberId: string) => Promise<void>;
  makeContribution: (contribution: Omit<Contribution, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  makeFullCircleContribution: (memberId: string, amount: number, method: string, note?: string) => Promise<boolean>;
  confirmContribution: (contributionId: string) => Promise<boolean>;
  rejectContribution: (contributionId: string, reason: string) => Promise<boolean>;
  generatePlannedInstallments: (settings: GroupSettings, circle: Circle) => string[];
  getContributionStatus: (memberId: string, periodIndex: number, expectedAmount?: number) => 'paid' | 'partial' | 'overdue' | 'pending';
  getMemberArrears: (memberId: string, expectedAmount?: number) => { periods: number[]; totalAmount: number };
  getTotalConfirmedAmount: () => number;
  refreshData: () => Promise<void>;
}

export const useContributionStore = create<ContributionState>((set, get) => ({
  // Initial state
  contributions: [],
  plannedInstallments: [],
  currentPeriodIndex: 0,
  memberContributions: {},
  isLoading: false,
  error: null,

  // Load contributions for a group and circle
  loadContributions: async (groupId: string, circleId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          member:profiles!contributions_member_id_fkey(full_name, phone),
          created_by_user:profiles!contributions_created_by_fkey(full_name, phone)
        `)
        .eq('group_id', groupId)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contributions = data || [];
      set({ contributions, isLoading: false });
      
      // Group contributions by member
      const memberContributions: Record<string, Contribution[]> = {};
      contributions.forEach(contribution => {
        if (!memberContributions[contribution.member_id]) {
          memberContributions[contribution.member_id] = [];
        }
        memberContributions[contribution.member_id].push(contribution);
      });
      
      set({ memberContributions });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load contributions for a specific member
  loadMemberContributions: async (groupId: string, circleId: string, memberId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          member:profiles!contributions_member_id_fkey(full_name, phone),
          created_by_user:profiles!contributions_created_by_fkey(full_name, phone)
        `)
        .eq('group_id', groupId)
        .eq('circle_id', circleId)
        .eq('member_id', memberId)
        .order('period_index', { ascending: true });

      if (error) throw error;

      const contributions = data || [];
      
      // Update member contributions
      set(state => ({
        memberContributions: {
          ...state.memberContributions,
          [memberId]: contributions
        },
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Make a single contribution
  makeContribution: async (contribution: Omit<Contribution, 'id' | 'created_at' | 'updated_at'>) => {
    set({ isLoading: true, error: null });
    
    try {
      // Direct insert into contributions table
      const { data, error } = await supabase
        .from('contributions')
        .insert({
          group_id: contribution.group_id,
          circle_id: contribution.circle_id,
          member_id: contribution.member_id,
          period_index: contribution.period_index,
          planned_installments: contribution.planned_installments,
          amount: contribution.amount,
          method: contribution.method,
          note: contribution.note || '',
          attachment_url: contribution.attachment_url || null,
          contribution_amount_snapshot: contribution.contribution_amount_snapshot,
          created_by: contribution.created_by,
          status: 'PENDING' // Set status to PENDING when creating contribution
        })
        .select()
        .single();

      if (error) throw error;

      // Note: Ledger entry will be created only when treasurer confirms the contribution

// Reload contributions
      await get().loadContributions(contribution.group_id, contribution.circle_id);
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.error('Contribution creation error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Make full circle contribution (all remaining periods)
  makeFullCircleContribution: async (memberId: string, amount: number, method: string, note?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGroup, currentCircle, groupSettings } = useGroupStore.getState();
      if (!currentGroup || !currentCircle || !groupSettings) {
        throw new Error('Missing group or circle data');
      }

      // Generate planned installments
      const plannedInstallments = get().generatePlannedInstallments(groupSettings, currentCircle);
      const currentPeriod = currentPeriodIndex(plannedInstallments);
      const remainingPeriods = plannedInstallments.length - currentPeriod;

      if (remainingPeriods <= 0) {
        throw new Error('No remaining periods in this circle');
      }

      // Calculate amount per period
      const amountPerPeriod = Math.floor(amount / remainingPeriods);
      const remainder = amount % remainingPeriods;

      // Create contributions for each remaining period
      const contributions = [];
      for (let i = currentPeriod; i < plannedInstallments.length; i++) {
        let periodAmount = amountPerPeriod;
        
        // Add remainder to the last period
        if (i === plannedInstallments.length - 1) {
          periodAmount += remainder;
        }

        contributions.push({
          group_id: currentGroup.id,
          circle_id: currentCircle.id,
          member_id: memberId,
          period_index: i,
          planned_installments: plannedInstallments.length,
          amount: periodAmount,
          method,
          note: note || `Full circle payment - Period ${i + 1}`,
          attachment_url: null,
          contribution_amount_snapshot: periodAmount,
          created_by: memberId, // Will be updated by RPC function
        });
      }

      // Make all contributions
      let success = true;
      for (const contribution of contributions) {
        const result = await get().makeContribution(contribution);
        if (!result) {
          success = false;
          break;
        }
      }

      set({ isLoading: false });
      return success;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Confirm a pending contribution (treasurer action)
  confirmContribution: async (contributionId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update contribution status to CONFIRMED
      const { data, error } = await supabase
        .from('contributions')
        .update({
          status: 'CONFIRMED',
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contributionId)
        .select()
        .single();

      if (error) {
        console.error('Error confirming contribution:', error);
        throw new Error(`Failed to confirm contribution: ${error.message}`);
      }

      // Create ledger entry for confirmed contribution
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          group_id: data.group_id,
          circle_id: data.circle_id,
          member_id: data.member_id,
          type: 'CONTRIBUTION_IN',
          ref_id: data.id,
          amount: data.contribution_amount_snapshot,
          direction: 'IN',
          created_by: user.id
        });

      if (ledgerError) {
        console.error('Error creating ledger entry:', ledgerError);
        throw ledgerError;
      }

      // Reload contributions to reflect changes
      await get().loadContributions(data.group_id, data.circle_id);
      
      // Also reload balance to reflect the new contribution
      const groupStore = useGroupStore.getState();
      await groupStore.loadBalance(data.group_id, data.circle_id);
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Reject a pending contribution (treasurer action)
  rejectContribution: async (contributionId: string, reason: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update contribution status to REJECTED
      const { data, error } = await supabase
        .from('contributions')
        .update({
          status: 'REJECTED',
          rejection_reason: reason,
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contributionId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting contribution:', error);
        throw new Error(`Failed to reject contribution: ${error.message}`);
      }

      // Reload contributions to reflect changes
      await get().loadContributions(data.group_id, data.circle_id);
      
      // Also reload balance to reflect the contribution rejection
      const groupStore = useGroupStore.getState();
      await groupStore.loadBalance(data.group_id, data.circle_id);
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Generate planned installments based on group settings
  generatePlannedInstallments: (settings: GroupSettings, circle: Circle) => {
    const installments = computePlannedInstallments({
      strategy: settings.contribution_strategy,
      circleStart: circle.start_date,
      circleDurationDays: settings.circle_duration_days,
      contributionIntervalDays: settings.contribution_interval_days,
      installmentsPerCircle: settings.installments_per_circle,
    });

    set({ plannedInstallments: installments });
    return installments;
  },

  // Get contribution status for a member and period
  getContributionStatus: (memberId: string, periodIndex: number, expectedAmount?: number) => {
    const { memberContributions, plannedInstallments } = get();
    const memberContribs = memberContributions[memberId] || [];
    
    // Find CONFIRMED contributions for this period only
    const periodContributions = memberContribs.filter(c => 
      c.period_index === periodIndex && c.status === 'CONFIRMED'
    );
    
    if (periodContributions.length === 0) {
      // Check if period is overdue
      const periodDate = new Date(plannedInstallments[periodIndex]);
      const now = new Date();
      return now > periodDate ? 'overdue' : 'pending';
    }

    // Calculate total paid for this period (only confirmed contributions)
    const totalPaid = periodContributions.reduce((sum, c) => sum + c.amount, 0);
    
    // Get expected amount from parameter or contribution snapshot
    let periodExpectedAmount = expectedAmount || 0;
    if (periodExpectedAmount === 0 && periodContributions.length > 0) {
      periodExpectedAmount = periodContributions[0]?.contribution_amount_snapshot || 0;
    }
    
    if (totalPaid >= periodExpectedAmount) {
      return 'paid';
    } else if (totalPaid > 0) {
      return 'partial';
    } else {
      return 'pending';
    }
  },

  // Get member arrears
  getMemberArrears: (memberId: string, expectedAmount?: number) => {
    const { memberContributions, plannedInstallments } = get();
    const memberContribs = memberContributions[memberId] || [];
    
    const arrears: { periods: number[]; totalAmount: number } = {
      periods: [],
      totalAmount: 0
    };

    // Check each period
    for (let i = 0; i < plannedInstallments.length; i++) {
      const status = get().getContributionStatus(memberId, i, expectedAmount);
      if (status === 'overdue' || status === 'partial') {
        arrears.periods.push(i);
        
        // Calculate amount owed (only confirmed contributions)
        const periodContributions = memberContribs.filter(c => 
          c.period_index === i && c.status === 'CONFIRMED'
        );
        const totalPaid = periodContributions.reduce((sum, c) => sum + c.amount, 0);
        
        // Get expected amount from parameter, contribution snapshot, or use a default
        let periodExpectedAmount = expectedAmount || 0;
        if (periodExpectedAmount === 0 && periodContributions.length > 0) {
          periodExpectedAmount = periodContributions[0]?.contribution_amount_snapshot || 0;
        }
        if (periodExpectedAmount === 0) {
          // Fallback: get from any contribution for this member or use a default
          const anyContribution = memberContribs.find(c => c.contribution_amount_snapshot);
          periodExpectedAmount = anyContribution?.contribution_amount_snapshot || 10000; // Default amount
        }
        
        const amountOwed = Math.max(0, periodExpectedAmount - totalPaid);
        arrears.totalAmount += amountOwed;
      }
    }

    return arrears;
  },

  // Get total confirmed contributions amount
  getTotalConfirmedAmount: () => {
    const { contributions } = get();
    return contributions
      .filter(c => c.status === 'CONFIRMED')
      .reduce((sum, c) => sum + c.amount, 0);
  },

  // Refresh all data
  refreshData: async () => {
    const { contributions } = get();
    if (contributions.length === 0) return;

    // Get group and circle from first contribution
    const firstContribution = contributions[0];
    if (!firstContribution) return;

    await get().loadContributions(firstContribution.group_id, firstContribution.circle_id);
  },
}));
