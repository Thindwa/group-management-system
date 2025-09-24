import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { AdminService } from '../services/adminService';
import { Group, GroupSettings, Circle, Profile, BalanceInfo, UserRole } from '../types';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Create admin client for auth operations
const supabaseAdmin = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

interface GroupState {
  // Data
  currentGroup: Group | null;
  groupSettings: GroupSettings | null;
  currentCircle: Circle | null;
  members: Profile[];
  balance: BalanceInfo | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadGroup: (groupId: string) => Promise<void>;
  loadGroupSettings: (groupId: string) => Promise<void>;
  loadCurrentCircle: (groupId: string) => Promise<void>;
  loadMembers: (groupId: string) => Promise<void>;
  loadBalance: (groupId: string, circleId: string) => Promise<void>;
  updateGroupSettings: (settings: Partial<GroupSettings>) => Promise<boolean>;
  createGroup: (groupData: { name: string; currency: string }) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // User management (admin only)
  createUser: (userData: {
    full_name: string;
    phone: string;
    email: string;
    role: UserRole;
  }) => Promise<any>;
  updateUser: (userId: string, updates: {
    full_name?: string;
    phone?: string;
    role?: UserRole;
  }) => Promise<any>;
  deleteUser: (userId: string) => Promise<any>;
  resetUserPassword: (userId: string) => Promise<any>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  // Initial state
  currentGroup: null,
  groupSettings: null,
  currentCircle: null,
  members: [],
  balance: null,
  isLoading: false,
  error: null,

  // Load group data
  loadGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      set({ currentGroup: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load group settings
  loadGroupSettings: async (groupId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('group_settings')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (error) throw error;
      set({ groupSettings: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load current active circle
  loadCurrentCircle: async (groupId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('circles')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'ACTIVE')
        .single();

      if (error) throw error;
      set({ currentCircle: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load group members
  loadMembers: async (groupId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('group_id', groupId)
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch emails from auth users if admin client is available
      const membersWithEmails = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            if (supabaseAdmin) {
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
              return {
                ...profile,
                email: authUser?.user?.email || null,
              };
            } else {
              return {
                ...profile,
                email: null,
              };
            }
          } catch (error) {
            console.warn(`Could not fetch email for user ${profile.id}:`, error);
            return {
              ...profile,
              email: null,
            };
          }
        })
      );

      set({ members: membersWithEmails, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Create a new user (admin only)
  createUser: async (userData: {
    full_name: string;
    phone: string;
    email: string;
    role: UserRole;
  }) => {
    const { currentGroup } = get();
    if (!currentGroup) {
      throw new Error('No group selected');
    }

    set({ isLoading: true, error: null });
    
    try {
      const result = await AdminService.createUser({
        ...userData,
        group_id: currentGroup.id,
      });

      if (result.success) {
        // Refresh members list
        await get().loadMembers(currentGroup.id);
        set({ isLoading: false });
        return result;
      } else {
        throw new Error(result.error || 'Failed to create user');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update user profile
  updateUser: async (userId: string, updates: {
    full_name?: string;
    phone?: string;
    role?: UserRole;
  }) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await AdminService.updateUser(userId, updates);
      
      if (result.success) {
        // Update local state
        const { members } = get();
        const updatedMembers = members.map(member => 
          member.id === userId ? { ...member, ...updates } : member
        );
        set({ members: updatedMembers, isLoading: false });
        return result;
      } else {
        throw new Error(result.error || 'Failed to update user');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await AdminService.deleteUser(userId);
      
      if (result.success) {
        // Remove from local state
        const { members, currentGroup } = get();
        const updatedMembers = members.filter(member => member.id !== userId);
        set({ members: updatedMembers, isLoading: false });
        
        // Refresh members list
        if (currentGroup) {
          await get().loadMembers(currentGroup.id);
        }
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete user');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Reset user password
  resetUserPassword: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const newPassword = AdminService.generatePassword();
      const result = await AdminService.resetUserPassword(userId, newPassword);
      
      if (result.success) {
        set({ isLoading: false });
        return { ...result, password: newPassword };
      } else {
        throw new Error(result.error || 'Failed to reset password');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Load balance information
  loadBalance: async (groupId: string, circleId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Calculate available balance from ledger
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('ledger')
        .select('amount, direction')
        .eq('group_id', groupId)
        .eq('circle_id', circleId);

      if (ledgerError) throw ledgerError;

      let available = 0;
      ledgerData?.forEach(entry => {
        if (entry.direction === 'IN') {
          available += entry.amount;
        } else {
          available -= entry.amount;
        }
      });

      // Get reserve amount from group settings
      const { groupSettings } = get();
      const reserve = groupSettings?.reserve_min_balance || 0;
      const spendable = Math.max(0, available - reserve);

      const balance: BalanceInfo = {
        available,
        reserve,
        spendable
      };

      set({ balance, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Update group settings
  updateGroupSettings: async (settings: Partial<GroupSettings>) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentGroup } = get();
      if (!currentGroup) {
        set({ error: 'No group selected', isLoading: false });
        return false;
      }

      const { error } = await supabase
        .from('group_settings')
        .update(settings)
        .eq('group_id', currentGroup.id);

      if (error) throw error;

      // Reload settings
      await get().loadGroupSettings(currentGroup.id);
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Create a new group
  createGroup: async (groupData: { name: string; currency: string }) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: 'No user logged in', isLoading: false });
        return false;
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupData.name,
          currency: groupData.currency,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Create default group settings
      const { error: settingsError } = await supabase
        .from('group_settings')
        .insert({
          group_id: group.id,
          contribution_amount_default: 10000,
          contribution_strategy: 'INSTALLMENTS_PER_CIRCLE',
          installments_per_circle: 4,
          loan_interest_percent: 20,
          loan_period_days: 30,
          grace_period_days: 5,
          funeral_benefit: 50000,
          sickness_benefit: 30000,
          allowed_relatives: ["mother", "father", "sister", "brother", "child", "husband", "wife"],
          reserve_min_balance: 0,
          auto_waitlist_if_insufficient: true,
          auto_waitlist_processing: true,
          waitlist_policy: 'BENEFITS_FIRST'
        });

      if (settingsError) throw settingsError;

      // Create first circle
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31);

      const { error: circleError } = await supabase
        .from('circles')
        .insert({
          group_id: group.id,
          year: currentYear,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'ACTIVE'
        });

      if (circleError) throw circleError;

      // Update user's group_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ group_id: group.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      set({ currentGroup: group, isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },


  // Remove member
  removeMember: async (memberId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Remove from group (set group_id to null)
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: null })
        .eq('id', memberId);

      if (error) throw error;

      // Reload members
      const { currentGroup } = get();
      if (currentGroup) {
        await get().loadMembers(currentGroup.id);
      }
      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Refresh all data
  refreshData: async () => {
    const { currentGroup } = get();
    if (!currentGroup) return;

    set({ isLoading: true, error: null });
    
    try {
      // Load data sequentially to avoid race conditions
      await get().loadGroup(currentGroup.id);
      await get().loadGroupSettings(currentGroup.id);
      await get().loadCurrentCircle(currentGroup.id);
      await get().loadMembers(currentGroup.id);

      // Load balance after circle is available
      const { currentCircle } = get();
      if (currentCircle) {
        await get().loadBalance(currentGroup.id, currentCircle.id);
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
