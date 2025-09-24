import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Benefit, GroupSettings, Circle } from '../types';
import { useGroupStore } from './groupStore';

interface BenefitState {
  // Data
  benefits: Benefit[];
  pendingBenefits: Benefit[];
  approvedBenefits: Benefit[];
  waitlistedBenefits: Benefit[];
  paidBenefits: Benefit[];
  memberBenefits: Record<string, Benefit[]>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadBenefits: (groupId: string, circleId: string) => Promise<void>;
  loadMemberBenefits: (groupId: string, circleId: string, memberId: string) => Promise<void>;
  requestBenefit: (benefit: Omit<Benefit, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  reviewBenefit: (benefitId: string, action: 'approve' | 'reject', note?: string) => Promise<boolean>;
  payBenefit: (benefitId: string, amount: number, method: string, note?: string) => Promise<boolean>;
  getWaitlistPosition: (benefitId: string) => Promise<number | null>;
  promoteWaitlist: () => Promise<boolean>;
  refreshData: () => Promise<void>;
}

export const useBenefitStore = create<BenefitState>((set, get) => ({
  // Initial state
  benefits: [],
  pendingBenefits: [],
  approvedBenefits: [],
  waitlistedBenefits: [],
  paidBenefits: [],
  memberBenefits: {},
  isLoading: false,
  error: null,

  // Load benefits for a group and circle
  loadBenefits: async (groupId: string, circleId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('benefits')
        .select(`
          *,
          member:profiles!benefits_member_id_fkey(full_name, phone),
          approved_by_user:profiles!benefits_approved_by_fkey(full_name, phone),
          paid_by_user:profiles!benefits_paid_by_fkey(full_name, phone)
        `)
        .eq('group_id', groupId)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const benefits = data || [];
      
      // Categorize benefits
      const pendingBenefits = benefits.filter(b => b.status === 'PENDING');
      const approvedBenefits = benefits.filter(b => b.status === 'APPROVED');
      const waitlistedBenefits = benefits.filter(b => b.status === 'WAITLISTED');
      const paidBenefits = benefits.filter(b => b.status === 'PAID');
      
      set({ 
        benefits, 
        pendingBenefits, 
        approvedBenefits, 
        waitlistedBenefits,
        paidBenefits,
        isLoading: false 
      });
      
      // Group benefits by member
      const memberBenefits: Record<string, Benefit[]> = {};
      benefits.forEach(benefit => {
        if (!memberBenefits[benefit.member_id]) {
          memberBenefits[benefit.member_id] = [];
        }
        memberBenefits[benefit.member_id].push(benefit);
      });
      
      set({ memberBenefits });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load benefits for a specific member
  loadMemberBenefits: async (groupId: string, circleId: string, memberId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('benefits')
        .select(`
          *,
          member:profiles!benefits_member_id_fkey(full_name, phone),
          approved_by_user:profiles!benefits_approved_by_fkey(full_name, phone),
          paid_by_user:profiles!benefits_paid_by_fkey(full_name, phone)
        `)
        .eq('group_id', groupId)
        .eq('circle_id', circleId)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const benefits = data || [];
      
      // Update member benefits
      set(state => ({
        memberBenefits: {
          ...state.memberBenefits,
          [memberId]: benefits
        },
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Request a new benefit
  requestBenefit: async (benefit: Omit<Benefit, 'id' | 'created_at' | 'updated_at'>) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('benefits')
        .insert(benefit)
        .select(`
          *,
          member:profiles!benefits_member_id_fkey(full_name, phone),
          approved_by_user:profiles!benefits_approved_by_fkey(full_name, phone),
          paid_by_user:profiles!benefits_paid_by_fkey(full_name, phone)
        `)
        .single();

      if (error) throw error;

      // Add to benefits list
      set(state => ({
        benefits: [data, ...state.benefits],
        pendingBenefits: [data, ...state.pendingBenefits],
        isLoading: false
      }));

      // Update member benefits
      set(state => ({
        memberBenefits: {
          ...state.memberBenefits,
          [benefit.member_id]: [data, ...(state.memberBenefits[benefit.member_id] || [])]
        }
      }));

      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Review a benefit (approve or reject)
  reviewBenefit: async (benefitId: string, action: 'approve' | 'reject', note?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Reviewing benefit with:', { benefitId, action, note });
      
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
        throw new Error('Only Chairperson, Admin, or Super Admin can approve benefits');
      }

      // Update benefit status directly
      const { data, error } = await supabase
        .from('benefits')
        .update({
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', benefitId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      console.log('Benefit updated successfully:', data);

      // Reload benefits to get updated data
      const { benefits } = get();
      const benefit = benefits.find(b => b.id === benefitId);
      if (benefit) {
        await get().loadBenefits(benefit.group_id, benefit.circle_id);
      }

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.error('Benefit review error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Pay a benefit
  payBenefit: async (benefitId: string, amount: number, method: string, note?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Paying benefit:', { benefitId, amount, method, note });
      
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

      // Only TREASURER, ADMIN, or SUPERADMIN can make payments
      if (!['TREASURER', 'ADMIN', 'SUPERADMIN'].includes(profile.role)) {
        throw new Error('Only Treasurer, Admin, or Super Admin can make payments');
      }

      // Update benefit status to PAID
      const { data, error } = await supabase
        .from('benefits')
        .update({
          status: 'PAID',
          paid_by: user.id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', benefitId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      console.log('Benefit paid successfully:', data);

      // Create ledger entry for benefit payment
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          group_id: data.group_id,
          circle_id: data.circle_id,
          member_id: data.member_id,
          type: 'BENEFIT_OUT',
          ref_id: data.id,
          amount: amount,
          direction: 'OUT',
          created_by: user.id
        });

      if (ledgerError) {
        console.error('Error creating ledger entry:', ledgerError);
        throw ledgerError;
      }

      // Reload benefits and update group balance
      const { benefits } = get();
      const benefit = benefits.find(b => b.id === benefitId);
      if (benefit) {
        await get().loadBenefits(benefit.group_id, benefit.circle_id);
        // Update group balance
        const groupStore = useGroupStore.getState();
        await groupStore.loadBalance(benefit.group_id, benefit.circle_id);
      }

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      console.error('Benefit payment error:', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Get waitlist position for a benefit
  getWaitlistPosition: async (benefitId: string) => {
    try {
      const { waitlistedBenefits } = get();
      const benefit = waitlistedBenefits.find(b => b.id === benefitId);
      return benefit?.waitlist_position || null;
    } catch (error) {
      return null;
    }
  },

  // Promote waitlist items
  promoteWaitlist: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Use RPC function to try settling waitlist
      const { data, error } = await supabase
        .rpc('rpc_try_settle_waitlist');

      if (error) throw error;

      // Reload benefits to get updated data
      const { benefits } = get();
      if (benefits.length > 0) {
        const firstBenefit = benefits[0];
        await get().loadBenefits(firstBenefit.group_id, firstBenefit.circle_id);
      }

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Refresh all data
  refreshData: async () => {
    const { benefits } = get();
    if (benefits.length === 0) return;

    // Get group and circle from first benefit
    const firstBenefit = benefits[0];
    if (!firstBenefit) return;

    set({ isLoading: true, error: null });
    
    try {
      await get().loadBenefits(firstBenefit.group_id, firstBenefit.circle_id);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
