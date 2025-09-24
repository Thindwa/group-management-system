import { LedgerEntry } from '../types';

export interface LedgerSummary {
  totalIn: number;
  totalOut: number;
  netBalance: number;
  entryCount: number;
  byType: Record<string, { count: number; total: number }>;
  byDirection: { IN: number; OUT: number };
  byMember: Record<string, { count: number; total: number }>;
}

export function calculateLedgerSummary(entries: LedgerEntry[]): LedgerSummary {
  const summary: LedgerSummary = {
    totalIn: 0,
    totalOut: 0,
    netBalance: 0,
    entryCount: entries.length,
    byType: {},
    byDirection: { IN: 0, OUT: 0 },
    byMember: {},
  };

  entries.forEach(entry => {
    // Calculate totals by direction
    if (entry.direction === 'IN') {
      summary.totalIn += entry.amount;
      summary.byDirection.IN += entry.amount;
    } else {
      summary.totalOut += entry.amount;
      summary.byDirection.OUT += entry.amount;
    }

    // Calculate by type
    if (!summary.byType[entry.type]) {
      summary.byType[entry.type] = { count: 0, total: 0 };
    }
    summary.byType[entry.type].count += 1;
    summary.byType[entry.type].total += entry.direction === 'IN' ? entry.amount : -entry.amount;

    // Calculate by member
    if (entry.member_id) {
      if (!summary.byMember[entry.member_id]) {
        summary.byMember[entry.member_id] = { count: 0, total: 0 };
      }
      summary.byMember[entry.member_id].count += 1;
      summary.byMember[entry.member_id].total += entry.direction === 'IN' ? entry.amount : -entry.amount;
    }
  });

  summary.netBalance = summary.totalIn - summary.totalOut;

  return summary;
}

export function filterLedgerEntries(
  entries: LedgerEntry[],
  filters: {
    startDate?: string | null;
    endDate?: string | null;
    type?: string | null;
    memberId?: string | null;
    direction?: 'IN' | 'OUT' | null;
  }
): LedgerEntry[] {
  let filtered = [...entries];

  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter(entry => 
      new Date(entry.created_at) >= startDate
    );
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999); // Include entire end date
    filtered = filtered.filter(entry => 
      new Date(entry.created_at) <= endDate
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

  return filtered;
}

export function getLedgerEntryTypeInfo(type: string) {
  const typeInfo = {
    'CONTRIBUTION_IN': {
      label: 'Contribution',
      icon: '💰',
      color: '#10B981',
      description: 'Member contribution payment',
    },
    'BENEFIT_OUT': {
      label: 'Benefit Payment',
      icon: '🎁',
      color: '#EF4444',
      description: 'Funeral or sickness benefit payment',
    },
    'LOAN_OUT': {
      label: 'Loan Disbursement',
      icon: '🏦',
      color: '#F59E0B',
      description: 'Loan amount disbursed to member',
    },
    'LOAN_REPAYMENT_IN': {
      label: 'Loan Repayment',
      icon: '💳',
      color: '#10B981',
      description: 'Loan repayment from member',
    },
    'ADJUSTMENT': {
      label: 'Adjustment',
      icon: '⚖️',
      color: '#6B7280',
      description: 'Manual balance adjustment',
    },
  };

  return typeInfo[type as keyof typeof typeInfo] || {
    label: type,
    icon: '❓',
    color: '#6B7280',
    description: 'Unknown entry type',
  };
}

export function formatCurrency(amount: number, currency: string = 'MWK'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatDate(dateString: string, format: 'short' | 'long' | 'time' = 'short'): string {
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    case 'long':
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    case 'time':
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      return date.toLocaleDateString();
  }
}

export function getBalanceStatus(balance: number, reserve: number): {
  status: 'healthy' | 'low' | 'critical';
  color: string;
  message: string;
} {
  const spendable = Math.max(0, balance - reserve);
  const percentage = balance > 0 ? (spendable / balance) * 100 : 0;

  if (spendable <= 0) {
    return {
      status: 'critical',
      color: '#EF4444',
      message: 'No funds available for new approvals',
    };
  }

  if (percentage < 10) {
    return {
      status: 'low',
      color: '#F59E0B',
      message: 'Low spendable balance - new requests may be waitlisted',
    };
  }

  return {
    status: 'healthy',
    color: '#10B981',
    message: 'Healthy balance - ready for new approvals',
  };
}

export interface LedgerSummary {
  totalIn: number;
  totalOut: number;
  netBalance: number;
  entryCount: number;
  byType: Record<string, { count: number; total: number }>;
  byDirection: { IN: number; OUT: number };
  byMember: Record<string, { count: number; total: number }>;
}

export function calculateLedgerSummary(entries: LedgerEntry[]): LedgerSummary {
  const summary: LedgerSummary = {
    totalIn: 0,
    totalOut: 0,
    netBalance: 0,
    entryCount: entries.length,
    byType: {},
    byDirection: { IN: 0, OUT: 0 },
    byMember: {},
  };

  entries.forEach(entry => {
    // Calculate totals by direction
    if (entry.direction === 'IN') {
      summary.totalIn += entry.amount;
      summary.byDirection.IN += entry.amount;
    } else {
      summary.totalOut += entry.amount;
      summary.byDirection.OUT += entry.amount;
    }

    // Calculate by type
    if (!summary.byType[entry.type]) {
      summary.byType[entry.type] = { count: 0, total: 0 };
    }
    summary.byType[entry.type].count += 1;
    summary.byType[entry.type].total += entry.direction === 'IN' ? entry.amount : -entry.amount;

    // Calculate by member
    if (entry.member_id) {
      if (!summary.byMember[entry.member_id]) {
        summary.byMember[entry.member_id] = { count: 0, total: 0 };
      }
      summary.byMember[entry.member_id].count += 1;
      summary.byMember[entry.member_id].total += entry.direction === 'IN' ? entry.amount : -entry.amount;
    }
  });

  summary.netBalance = summary.totalIn - summary.totalOut;

  return summary;
}

export function filterLedgerEntries(
  entries: LedgerEntry[],
  filters: {
    startDate?: string | null;
    endDate?: string | null;
    type?: string | null;
    memberId?: string | null;
    direction?: 'IN' | 'OUT' | null;
  }
): LedgerEntry[] {
  let filtered = [...entries];

  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter(entry => 
      new Date(entry.created_at) >= startDate
    );
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999); // Include entire end date
    filtered = filtered.filter(entry => 
      new Date(entry.created_at) <= endDate
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

  return filtered;
}

export function getLedgerEntryTypeInfo(type: string) {
  const typeInfo = {
    'CONTRIBUTION_IN': {
      label: 'Contribution',
      icon: '💰',
      color: '#10B981',
      description: 'Member contribution payment',
    },
    'BENEFIT_OUT': {
      label: 'Benefit Payment',
      icon: '🎁',
      color: '#EF4444',
      description: 'Funeral or sickness benefit payment',
    },
    'LOAN_OUT': {
      label: 'Loan Disbursement',
      icon: '🏦',
      color: '#F59E0B',
      description: 'Loan amount disbursed to member',
    },
    'LOAN_REPAYMENT_IN': {
      label: 'Loan Repayment',
      icon: '💳',
      color: '#10B981',
      description: 'Loan repayment from member',
    },
    'ADJUSTMENT': {
      label: 'Adjustment',
      icon: '⚖️',
      color: '#6B7280',
      description: 'Manual balance adjustment',
    },
  };

  return typeInfo[type as keyof typeof typeInfo] || {
    label: type,
    icon: '❓',
    color: '#6B7280',
    description: 'Unknown entry type',
  };
}

export function formatCurrency(amount: number, currency: string = 'MWK'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatDate(dateString: string, format: 'short' | 'long' | 'time' = 'short'): string {
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    case 'long':
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    case 'time':
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    default:
      return date.toLocaleDateString();
  }
}

export function getBalanceStatus(balance: number, reserve: number): {
  status: 'healthy' | 'low' | 'critical';
  color: string;
  message: string;
} {
  const spendable = Math.max(0, balance - reserve);
  const percentage = balance > 0 ? (spendable / balance) * 100 : 0;

  if (spendable <= 0) {
    return {
      status: 'critical',
      color: '#EF4444',
      message: 'No funds available for new approvals',
    };
  }

  if (percentage < 10) {
    return {
      status: 'low',
      color: '#F59E0B',
      message: 'Low spendable balance - new requests may be waitlisted',
    };
  }

  return {
    status: 'healthy',
    color: '#10B981',
    message: 'Healthy balance - ready for new approvals',
  };
}
