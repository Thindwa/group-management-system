import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { LedgerEntry, BalanceInfo } from '../types';

interface LedgerState {
  // Data
  entries: LedgerEntry[];
  balance: BalanceInfo | null;
  filteredEntries: LedgerEntry[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: {
    startDate: string | null;
    endDate: string | null;
    type: string | null;
    memberId: string | null;
    direction: 'IN' | 'OUT' | null;
  };
  
  // Actions
  loadLedgerEntries: (groupId: string, circleId: string) => Promise<void>;
  loadBalance: (groupId: string, circleId: string) => Promise<void>;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'created_at'>) => Promise<boolean>;
  updateFilters: (filters: Partial<LedgerState['filters']>) => void;
  clearFilters: () => void;
  refreshData: () => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  // Initial state
  entries: [],
  balance: null,
  filteredEntries: [],
  isLoading: false,
  error: null,
  filters: {
    startDate: null,
    endDate: null,
    type: null,
    memberId: null,
    direction: null,
  },

  // Load ledger entries
  loadLedgerEntries: async (groupId: string, circleId: string) => {
    set({ error: null });
    
    try {
      let query = supabase
        .from('ledger')
        .select(`
          *,
          member:profiles!ledger_member_id_fkey(full_name, phone),
          created_by_user:profiles!ledger_created_by_fkey(full_name, phone)
        `)
        .eq('group_id', groupId)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const entries = data || [];
      set({ entries });
      
      // Apply current filters
      get().applyFilters(entries);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Load balance information
  loadBalance: async (groupId: string, circleId: string) => {
    console.log('🚀 loadBalance called with:', { groupId, circleId });
    // Don't set isLoading to true here to prevent balance from being reset
    try {
      console.log('🔄 Loading balance for group:', groupId, 'circle:', circleId);
      
      // Calculate balance manually from ledger entries
      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from('ledger')
        .select('amount, direction')
        .eq('group_id', groupId);

      if (ledgerError) {
        console.error('❌ Ledger error:', ledgerError);
        throw ledgerError;
      }

      // Calculate total balance
      let totalBalance = 0;
      if (ledgerEntries) {
        ledgerEntries.forEach(entry => {
          if (entry.direction === 'IN') {
            totalBalance += entry.amount;
          } else if (entry.direction === 'OUT') {
            totalBalance -= entry.amount;
          }
        });
      }

      console.log('💰 Calculated balance from ledger:', totalBalance);

      // Get group settings for reserve
      const { data: settings, error: settingsError } = await supabase
        .from('group_settings')
        .select('reserve_min_balance')
        .eq('group_id', groupId)
        .single();

      if (settingsError) {
        console.error('❌ Settings error:', settingsError);
        throw settingsError;
      }

      const available = totalBalance;
      const reserve = settings?.reserve_min_balance || 0;
      const spendable = Math.max(0, available - reserve);

      console.log('📊 Balance calculation:', { available, reserve, spendable });

      const balanceInfo = { available, reserve, spendable };
      console.log('💾 Setting balance in store:', balanceInfo);
      
      set({ 
        balance: balanceInfo
      });
      
      // Verify the balance was set
      const currentState = get();
      console.log('✅ Balance in store after setting:', currentState.balance);
    } catch (error: any) {
      console.error('❌ Load balance error:', error);
      set({ error: error.message });
    }
  },

  // Recalculate balance from entries (fallback method)
  recalculateBalance: () => {
    const { entries } = get();
    let total = 0;
    
    entries.forEach(entry => {
      const amount = entry.direction === 'IN' ? entry.amount : -entry.amount;
      total += amount;
    });
    
    console.log('🧮 Manual balance calculation:', total);
    
    // Update balance with calculated amount
    const currentBalance = get().balance;
    if (currentBalance) {
      const spendable = Math.max(0, total - currentBalance.reserve);
      set({ 
        balance: { 
          available: total, 
          reserve: currentBalance.reserve, 
          spendable 
        } 
      });
    }
  },

  // Add ledger entry
  addLedgerEntry: async (entry: Omit<LedgerEntry, 'id' | 'created_at'>) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('ledger')
        .insert(entry)
        .select(`
          *,
          member:profiles!ledger_member_id_fkey(full_name, phone),
          created_by_user:profiles!ledger_created_by_fkey(full_name, phone)
        `)
        .single();

      if (error) throw error;

      // Add to entries list
      set(state => ({
        entries: [data, ...state.entries],
        isLoading: false
      }));

      // Apply filters to new entry
      get().applyFilters([data, ...get().entries]);

      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  // Update filters
  updateFilters: (newFilters: Partial<LedgerState['filters']>) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    
    set({ filters: updatedFilters });
    
    // Apply filters to current entries
    get().applyFilters(get().entries);
  },

  // Clear all filters
  clearFilters: () => {
    set({ 
      filters: {
        startDate: null,
        endDate: null,
        type: null,
        memberId: null,
        direction: null,
      }
    });
    
    // Show all entries
    set({ filteredEntries: get().entries });
  },

  // Apply filters to entries
  applyFilters: (entries: LedgerEntry[]) => {
    const { filters } = get();
    let filtered = [...entries];

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(entry => 
        new Date(entry.created_at) >= new Date(filters.startDate!)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(entry => 
        new Date(entry.created_at) <= new Date(filters.endDate!)
      );
    }

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(entry => entry.type === filters.type);
    }

    // Filter by member
    if (filters.memberId) {
      filtered = filtered.filter(entry => entry.member_id === filters.memberId);
    }

    // Filter by direction
    if (filters.direction) {
      filtered = filtered.filter(entry => entry.direction === filters.direction);
    }

    set({ filteredEntries: filtered });
  },

  // Refresh all data
  refreshData: async () => {
    set({ error: null });
    
    try {
      // Get current group and circle from the most recent entries
      const { entries } = get();
      if (entries.length > 0) {
        const firstEntry = entries[0];
        await Promise.all([
          get().loadLedgerEntries(firstEntry.group_id, firstEntry.circle_id),
          get().loadBalance(firstEntry.group_id, firstEntry.circle_id),
        ]);
      } else {
        // If no entries, try to get from current group/circle context
        // This would need to be passed from the component
        console.log('No entries to refresh from');
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
