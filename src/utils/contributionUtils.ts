import { Contribution } from '../types';

export interface ContributionStats {
  totalPaid: number;
  totalExpected: number;
  remaining: number;
  completionPercentage: number;
  periodsPaid: number;
  periodsRemaining: number;
  arrearsPeriods: number;
  arrearsAmount: number;
  averagePayment: number;
  lastPaymentDate: string | null;
  paymentMethods: Record<string, number>;
}

export function calculateContributionStats(
  contributions: Contribution[],
  expectedAmount: number,
  totalPeriods: number
): ContributionStats {
  const totalPaid = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalExpected = expectedAmount * totalPeriods;
  const remaining = Math.max(0, totalExpected - totalPaid);
  const completionPercentage = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;
  
  // Calculate periods paid
  const periodsPaid = new Set(contributions.map(c => c.period_index)).size;
  const periodsRemaining = totalPeriods - periodsPaid;
  
  // Calculate arrears
  const periodContributions: Record<number, Contribution[]> = {};
  contributions.forEach(c => {
    if (!periodContributions[c.period_index]) {
      periodContributions[c.period_index] = [];
    }
    periodContributions[c.period_index].push(c);
  });

  let arrearsPeriods = 0;
  let arrearsAmount = 0;

  for (let i = 0; i < totalPeriods; i++) {
    const periodContribs = periodContributions[i] || [];
    const periodPaid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    
    if (periodPaid < expectedAmount) {
      arrearsPeriods++;
      arrearsAmount += expectedAmount - periodPaid;
    }
  }

  // Calculate average payment
  const averagePayment = contributions.length > 0 ? totalPaid / contributions.length : 0;

  // Find last payment date
  const lastPaymentDate = contributions.length > 0 
    ? contributions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
    : null;

  // Calculate payment methods
  const paymentMethods: Record<string, number> = {};
  contributions.forEach(c => {
    paymentMethods[c.method] = (paymentMethods[c.method] || 0) + 1;
  });

  return {
    totalPaid,
    totalExpected,
    remaining,
    completionPercentage,
    periodsPaid,
    periodsRemaining,
    arrearsPeriods,
    arrearsAmount,
    averagePayment,
    lastPaymentDate,
    paymentMethods,
  };
}

export function getContributionStatus(
  contributions: Contribution[],
  periodIndex: number,
  expectedAmount: number
): 'paid' | 'partial' | 'overdue' | 'pending' {
  const periodContributions = contributions.filter(c => c.period_index === periodIndex);
  
  if (periodContributions.length === 0) {
    return 'pending';
  }

  // Calculate total paid for this period
  const totalPaid = periodContributions.reduce((sum, c) => sum + c.amount, 0);

  if (totalPaid >= expectedAmount) {
    return 'paid';
  } else if (totalPaid > 0) {
    return 'partial';
  } else {
    return 'pending';
  }
}

export function getMemberArrears(
  contributions: Contribution[],
  expectedAmount: number,
  totalPeriods: number
): { periods: number[]; totalAmount: number } {
  const periodContributions: Record<number, Contribution[]> = {};
  contributions.forEach(c => {
    if (!periodContributions[c.period_index]) {
      periodContributions[c.period_index] = [];
    }
    periodContributions[c.period_index].push(c);
  });

  const arrears: { periods: number[]; totalAmount: number } = {
    periods: [],
    totalAmount: 0
  };

  // Check each period
  for (let i = 0; i < totalPeriods; i++) {
    const periodContribs = periodContributions[i] || [];
    const totalPaid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    
    if (totalPaid < expectedAmount) {
      arrears.periods.push(i);
      arrears.totalAmount += expectedAmount - totalPaid;
    }
  }

  return arrears;
}

export function formatContributionMethod(method: string): string {
  const methodLabels = {
    'cash': 'Cash',
    'bank_transfer': 'Bank Transfer',
    'mobile_money': 'Mobile Money',
    'cheque': 'Cheque',
  };
  return methodLabels[method as keyof typeof methodLabels] || method.toUpperCase();
}

export function getContributionStatusColor(status: string): string {
  const colors = {
    paid: '#10B981',
    partial: '#F59E0B',
    overdue: '#EF4444',
    pending: '#6B7280',
  };
  return colors[status as keyof typeof colors] || '#6B7280';
}

export function getContributionStatusText(status: string): string {
  const texts = {
    paid: 'Paid',
    partial: 'Partial',
    overdue: 'Overdue',
    pending: 'Pending',
  };
  return texts[status as keyof typeof texts] || 'Unknown';
}

export function calculateContributionProgress(
  contributions: Contribution[],
  expectedAmount: number,
  totalPeriods: number
): {
  currentPeriod: number;
  nextDueDate: string | null;
  isOverdue: boolean;
  daysUntilNext: number | null;
} {
  const periodContributions: Record<number, Contribution[]> = {};
  contributions.forEach(c => {
    if (!periodContributions[c.period_index]) {
      periodContributions[c.period_index] = [];
    }
    periodContributions[c.period_index].push(c);
  });

  // Find current period (first unpaid period)
  let currentPeriod = 0;
  for (let i = 0; i < totalPeriods; i++) {
    const periodContribs = periodContributions[i] || [];
    const periodPaid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    
    if (periodPaid < expectedAmount) {
      currentPeriod = i;
      break;
    }
  }

  // Check if overdue
  const now = new Date();
  const isOverdue = currentPeriod < totalPeriods;

  // Calculate next due date (this would need planned installments)
  const nextDueDate = null; // This would be calculated from planned installments
  const daysUntilNext = null; // This would be calculated from planned installments

  return {
    currentPeriod,
    nextDueDate,
    isOverdue,
    daysUntilNext,
  };
}

export function generateContributionReport(
  contributions: Contribution[],
  expectedAmount: number,
  totalPeriods: number,
  memberName: string
): {
  summary: ContributionStats;
  periodBreakdown: Array<{
    period: number;
    expected: number;
    paid: number;
    remaining: number;
    status: string;
  }>;
  recommendations: string[];
} {
  const summary = calculateContributionStats(contributions, expectedAmount, totalPeriods);
  
  // Generate period breakdown
  const periodBreakdown = [];
  for (let i = 0; i < totalPeriods; i++) {
    const periodContribs = contributions.filter(c => c.period_index === i);
    const paid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    const remaining = Math.max(0, expectedAmount - paid);
    const status = getContributionStatus(contributions, i, expectedAmount);
    
    periodBreakdown.push({
      period: i + 1,
      expected: expectedAmount,
      paid,
      remaining,
      status: getContributionStatusText(status),
    });
  }

  // Generate recommendations
  const recommendations = [];
  
  if (summary.arrearsPeriods > 0) {
    recommendations.push(`Member has ${summary.arrearsPeriods} overdue periods totaling ${summary.arrearsAmount.toLocaleString()} MWK`);
  }
  
  if (summary.completionPercentage < 50) {
    recommendations.push('Member is behind on contributions - consider follow-up');
  }
  
  if (summary.completionPercentage >= 100) {
    recommendations.push('Member is fully up to date with contributions');
  }
  
  if (summary.averagePayment < expectedAmount * 0.8) {
    recommendations.push('Member tends to make partial payments - consider payment plan');
  }

  return {
    summary,
    periodBreakdown,
    recommendations,
  };
}

export interface ContributionStats {
  totalPaid: number;
  totalExpected: number;
  remaining: number;
  completionPercentage: number;
  periodsPaid: number;
  periodsRemaining: number;
  arrearsPeriods: number;
  arrearsAmount: number;
  averagePayment: number;
  lastPaymentDate: string | null;
  paymentMethods: Record<string, number>;
}

export function calculateContributionStats(
  contributions: Contribution[],
  expectedAmount: number,
  totalPeriods: number
): ContributionStats {
  const totalPaid = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalExpected = expectedAmount * totalPeriods;
  const remaining = Math.max(0, totalExpected - totalPaid);
  const completionPercentage = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;
  
  // Calculate periods paid
  const periodsPaid = new Set(contributions.map(c => c.period_index)).size;
  const periodsRemaining = totalPeriods - periodsPaid;
  
  // Calculate arrears
  const periodContributions: Record<number, Contribution[]> = {};
  contributions.forEach(c => {
    if (!periodContributions[c.period_index]) {
      periodContributions[c.period_index] = [];
    }
    periodContributions[c.period_index].push(c);
  });

  let arrearsPeriods = 0;
  let arrearsAmount = 0;

  for (let i = 0; i < totalPeriods; i++) {
    const periodContribs = periodContributions[i] || [];
    const periodPaid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    
    if (periodPaid < expectedAmount) {
      arrearsPeriods++;
      arrearsAmount += expectedAmount - periodPaid;
    }
  }

  // Calculate average payment
  const averagePayment = contributions.length > 0 ? totalPaid / contributions.length : 0;

  // Find last payment date
  const lastPaymentDate = contributions.length > 0 
    ? contributions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
    : null;

  // Calculate payment methods
  const paymentMethods: Record<string, number> = {};
  contributions.forEach(c => {
    paymentMethods[c.method] = (paymentMethods[c.method] || 0) + 1;
  });

  return {
    totalPaid,
    totalExpected,
    remaining,
    completionPercentage,
    periodsPaid,
    periodsRemaining,
    arrearsPeriods,
    arrearsAmount,
    averagePayment,
    lastPaymentDate,
    paymentMethods,
  };
}

export function getContributionStatus(
  contributions: Contribution[],
  periodIndex: number,
  expectedAmount: number
): 'paid' | 'partial' | 'overdue' | 'pending' {
  const periodContributions = contributions.filter(c => c.period_index === periodIndex);
  
  if (periodContributions.length === 0) {
    return 'pending';
  }

  // Calculate total paid for this period
  const totalPaid = periodContributions.reduce((sum, c) => sum + c.amount, 0);

  if (totalPaid >= expectedAmount) {
    return 'paid';
  } else if (totalPaid > 0) {
    return 'partial';
  } else {
    return 'pending';
  }
}

export function getMemberArrears(
  contributions: Contribution[],
  expectedAmount: number,
  totalPeriods: number
): { periods: number[]; totalAmount: number } {
  const periodContributions: Record<number, Contribution[]> = {};
  contributions.forEach(c => {
    if (!periodContributions[c.period_index]) {
      periodContributions[c.period_index] = [];
    }
    periodContributions[c.period_index].push(c);
  });

  const arrears: { periods: number[]; totalAmount: number } = {
    periods: [],
    totalAmount: 0
  };

  // Check each period
  for (let i = 0; i < totalPeriods; i++) {
    const periodContribs = periodContributions[i] || [];
    const totalPaid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    
    if (totalPaid < expectedAmount) {
      arrears.periods.push(i);
      arrears.totalAmount += expectedAmount - totalPaid;
    }
  }

  return arrears;
}

export function formatContributionMethod(method: string): string {
  const methodLabels = {
    'cash': 'Cash',
    'bank_transfer': 'Bank Transfer',
    'mobile_money': 'Mobile Money',
    'cheque': 'Cheque',
  };
  return methodLabels[method as keyof typeof methodLabels] || method.toUpperCase();
}

export function getContributionStatusColor(status: string): string {
  const colors = {
    paid: '#10B981',
    partial: '#F59E0B',
    overdue: '#EF4444',
    pending: '#6B7280',
  };
  return colors[status as keyof typeof colors] || '#6B7280';
}

export function getContributionStatusText(status: string): string {
  const texts = {
    paid: 'Paid',
    partial: 'Partial',
    overdue: 'Overdue',
    pending: 'Pending',
  };
  return texts[status as keyof typeof texts] || 'Unknown';
}

export function calculateContributionProgress(
  contributions: Contribution[],
  expectedAmount: number,
  totalPeriods: number
): {
  currentPeriod: number;
  nextDueDate: string | null;
  isOverdue: boolean;
  daysUntilNext: number | null;
} {
  const periodContributions: Record<number, Contribution[]> = {};
  contributions.forEach(c => {
    if (!periodContributions[c.period_index]) {
      periodContributions[c.period_index] = [];
    }
    periodContributions[c.period_index].push(c);
  });

  // Find current period (first unpaid period)
  let currentPeriod = 0;
  for (let i = 0; i < totalPeriods; i++) {
    const periodContribs = periodContributions[i] || [];
    const periodPaid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    
    if (periodPaid < expectedAmount) {
      currentPeriod = i;
      break;
    }
  }

  // Check if overdue
  const now = new Date();
  const isOverdue = currentPeriod < totalPeriods;

  // Calculate next due date (this would need planned installments)
  const nextDueDate = null; // This would be calculated from planned installments
  const daysUntilNext = null; // This would be calculated from planned installments

  return {
    currentPeriod,
    nextDueDate,
    isOverdue,
    daysUntilNext,
  };
}

export function generateContributionReport(
  contributions: Contribution[],
  expectedAmount: number,
  totalPeriods: number,
  memberName: string
): {
  summary: ContributionStats;
  periodBreakdown: Array<{
    period: number;
    expected: number;
    paid: number;
    remaining: number;
    status: string;
  }>;
  recommendations: string[];
} {
  const summary = calculateContributionStats(contributions, expectedAmount, totalPeriods);
  
  // Generate period breakdown
  const periodBreakdown = [];
  for (let i = 0; i < totalPeriods; i++) {
    const periodContribs = contributions.filter(c => c.period_index === i);
    const paid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
    const remaining = Math.max(0, expectedAmount - paid);
    const status = getContributionStatus(contributions, i, expectedAmount);
    
    periodBreakdown.push({
      period: i + 1,
      expected: expectedAmount,
      paid,
      remaining,
      status: getContributionStatusText(status),
    });
  }

  // Generate recommendations
  const recommendations = [];
  
  if (summary.arrearsPeriods > 0) {
    recommendations.push(`Member has ${summary.arrearsPeriods} overdue periods totaling ${summary.arrearsAmount.toLocaleString()} MWK`);
  }
  
  if (summary.completionPercentage < 50) {
    recommendations.push('Member is behind on contributions - consider follow-up');
  }
  
  if (summary.completionPercentage >= 100) {
    recommendations.push('Member is fully up to date with contributions');
  }
  
  if (summary.averagePayment < expectedAmount * 0.8) {
    recommendations.push('Member tends to make partial payments - consider payment plan');
  }

  return {
    summary,
    periodBreakdown,
    recommendations,
  };
}
