import { Benefit } from '../types';

export interface BenefitStats {
  totalRequests: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  waitlistedCount: number;
  paidCount: number;
  byType: {
    funeral: { count: number; amount: number };
    sickness: { count: number; amount: number };
  };
  averageAmount: number;
  approvalRate: number;
  waitlistRate: number;
}

export function calculateBenefitStats(benefits: Benefit[]): BenefitStats {
  const totalRequests = benefits.length;
  const totalAmount = benefits.reduce((sum, b) => sum + b.amount, 0);
  
  const pendingCount = benefits.filter(b => b.status === 'PENDING').length;
  const approvedCount = benefits.filter(b => b.status === 'APPROVED').length;
  const rejectedCount = benefits.filter(b => b.status === 'REJECTED').length;
  const waitlistedCount = benefits.filter(b => b.status === 'WAITLISTED').length;
  const paidCount = benefits.filter(b => b.status === 'PAID').length;
  
  const funeralBenefits = benefits.filter(b => b.type === 'FUNERAL');
  const sicknessBenefits = benefits.filter(b => b.type === 'SICKNESS');
  
  const byType = {
    funeral: {
      count: funeralBenefits.length,
      amount: funeralBenefits.reduce((sum, b) => sum + b.amount, 0),
    },
    sickness: {
      count: sicknessBenefits.length,
      amount: sicknessBenefits.reduce((sum, b) => sum + b.amount, 0),
    },
  };
  
  const averageAmount = totalRequests > 0 ? totalAmount / totalRequests : 0;
  const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0;
  const waitlistRate = totalRequests > 0 ? (waitlistedCount / totalRequests) * 100 : 0;
  
  return {
    totalRequests,
    totalAmount,
    pendingCount,
    approvedCount,
    rejectedCount,
    waitlistedCount,
    paidCount,
    byType,
    averageAmount,
    approvalRate,
    waitlistRate,
  };
}

export function getBenefitTypeInfo(type: string) {
  const typeInfo = {
    FUNERAL: {
      label: 'Funeral Benefit',
      icon: '🕊️',
      color: '#8B5CF6',
      description: 'Financial assistance for funeral expenses',
    },
    SICKNESS: {
      label: 'Sickness Benefit',
      icon: '🏥',
      color: '#06B6D4',
      description: 'Financial assistance for medical expenses',
    },
  };
  return typeInfo[type as keyof typeof typeInfo] || typeInfo.FUNERAL;
}

export function getBenefitStatusInfo(status: string) {
  const statusInfo = {
    PENDING: {
      label: 'Pending Review',
      icon: '⏳',
      color: '#F59E0B',
      description: 'Awaiting administrator review',
    },
    APPROVED: {
      label: 'Approved',
      icon: '✅',
      color: '#10B981',
      description: 'Approved and ready for payment',
    },
    REJECTED: {
      label: 'Rejected',
      icon: '❌',
      color: '#EF4444',
      description: 'Request has been rejected',
    },
    WAITLISTED: {
      label: 'Waitlisted',
      icon: '⏸️',
      color: '#6B7280',
      description: 'On waitlist due to insufficient funds',
    },
    PAID: {
      label: 'Paid',
      icon: '💰',
      color: '#3B82F6',
      description: 'Payment has been processed',
    },
  };
  return statusInfo[status as keyof typeof statusInfo] || statusInfo.PENDING;
}

export function formatBenefitAmount(amount: number, currency: string = 'MWK'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatBenefitDate(dateString: string, format: 'short' | 'long' | 'time' = 'short'): string {
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

export function getWaitlistPosition(benefits: Benefit[], benefitId: string): number | null {
  const benefit = benefits.find(b => b.id === benefitId);
  return benefit?.waitlist_position || null;
}

export function getWaitlistStatus(benefit: Benefit): {
  position: number | null;
  daysSinceWaitlisted: number | null;
  status: 'recent' | 'waiting' | 'long_wait';
} {
  const position = benefit.waitlist_position;
  const waitlistedAt = benefit.waitlisted_at;
  
  if (!position || !waitlistedAt) {
    return { position: null, daysSinceWaitlisted: null, status: 'recent' };
  }
  
  const daysSinceWaitlisted = Math.floor(
    (new Date().getTime() - new Date(waitlistedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let status: 'recent' | 'waiting' | 'long_wait' = 'recent';
  if (daysSinceWaitlisted > 30) {
    status = 'long_wait';
  } else if (daysSinceWaitlisted > 7) {
    status = 'waiting';
  }
  
  return { position, daysSinceWaitlisted, status };
}

export function calculateWaitlistImpact(benefits: Benefit[]): {
  totalAmount: number;
  byType: Record<string, number>;
  averageWaitTime: number;
  longestWait: number;
} {
  const waitlistedBenefits = benefits.filter(b => b.status === 'WAITLISTED');
  
  const totalAmount = waitlistedBenefits.reduce((sum, b) => sum + b.amount, 0);
  
  const byType: Record<string, number> = {};
  waitlistedBenefits.forEach(b => {
    byType[b.type] = (byType[b.type] || 0) + b.amount;
  });
  
  const waitTimes = waitlistedBenefits
    .filter(b => b.waitlisted_at)
    .map(b => {
      const waitlistedAt = new Date(b.waitlisted_at!);
      const now = new Date();
      return Math.floor((now.getTime() - waitlistedAt.getTime()) / (1000 * 60 * 60 * 24));
    });
  
  const averageWaitTime = waitTimes.length > 0 
    ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
    : 0;
  
  const longestWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
  
  return {
    totalAmount,
    byType,
    averageWaitTime,
    longestWait,
  };
}

export function generateBenefitReport(benefits: Benefit[]): {
  summary: BenefitStats;
  waitlistImpact: ReturnType<typeof calculateWaitlistImpact>;
  recommendations: string[];
} {
  const summary = calculateBenefitStats(benefits);
  const waitlistImpact = calculateWaitlistImpact(benefits);
  
  const recommendations: string[] = [];
  
  if (summary.waitlistRate > 50) {
    recommendations.push('High waitlist rate - consider increasing benefit limits or reserve balance');
  }
  
  if (summary.approvalRate < 70) {
    recommendations.push('Low approval rate - review benefit criteria and member eligibility');
  }
  
  if (waitlistImpact.averageWaitTime > 30) {
    recommendations.push('Long average wait time - consider faster processing or additional funding');
  }
  
  if (summary.byType.funeral.amount > summary.byType.sickness.amount * 2) {
    recommendations.push('High funeral benefit usage - consider reviewing funeral benefit limits');
  }
  
  if (summary.averageAmount > 50000) {
    recommendations.push('High average benefit amount - review benefit limits and approval criteria');
  }
  
  return {
    summary,
    waitlistImpact,
    recommendations,
  };
}

export function validateBenefitRequest(
  type: string,
  amount: number,
  reason: string,
  maxAmount: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!type || !['FUNERAL', 'SICKNESS'].includes(type)) {
    errors.push('Invalid benefit type');
  }
  
  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (amount > maxAmount) {
    errors.push(`Amount exceeds maximum limit of ${formatBenefitAmount(maxAmount)}`);
  }
  
  if (!reason || reason.trim().length < 10) {
    errors.push('Reason must be at least 10 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getBenefitPriority(benefit: Benefit): 'high' | 'medium' | 'low' {
  // High priority: Funeral benefits, large amounts, urgent reasons
  if (benefit.type === 'FUNERAL') return 'high';
  if (benefit.amount > 100000) return 'high';
  if (benefit.reason.toLowerCase().includes('urgent')) return 'high';
  
  // Medium priority: Sickness benefits, moderate amounts
  if (benefit.type === 'SICKNESS') return 'medium';
  if (benefit.amount > 50000) return 'medium';
  
  // Low priority: Small amounts, non-urgent reasons
  return 'low';
}

export interface BenefitStats {
  totalRequests: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  waitlistedCount: number;
  paidCount: number;
  byType: {
    funeral: { count: number; amount: number };
    sickness: { count: number; amount: number };
  };
  averageAmount: number;
  approvalRate: number;
  waitlistRate: number;
}

export function calculateBenefitStats(benefits: Benefit[]): BenefitStats {
  const totalRequests = benefits.length;
  const totalAmount = benefits.reduce((sum, b) => sum + b.amount, 0);
  
  const pendingCount = benefits.filter(b => b.status === 'PENDING').length;
  const approvedCount = benefits.filter(b => b.status === 'APPROVED').length;
  const rejectedCount = benefits.filter(b => b.status === 'REJECTED').length;
  const waitlistedCount = benefits.filter(b => b.status === 'WAITLISTED').length;
  const paidCount = benefits.filter(b => b.status === 'PAID').length;
  
  const funeralBenefits = benefits.filter(b => b.type === 'FUNERAL');
  const sicknessBenefits = benefits.filter(b => b.type === 'SICKNESS');
  
  const byType = {
    funeral: {
      count: funeralBenefits.length,
      amount: funeralBenefits.reduce((sum, b) => sum + b.amount, 0),
    },
    sickness: {
      count: sicknessBenefits.length,
      amount: sicknessBenefits.reduce((sum, b) => sum + b.amount, 0),
    },
  };
  
  const averageAmount = totalRequests > 0 ? totalAmount / totalRequests : 0;
  const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0;
  const waitlistRate = totalRequests > 0 ? (waitlistedCount / totalRequests) * 100 : 0;
  
  return {
    totalRequests,
    totalAmount,
    pendingCount,
    approvedCount,
    rejectedCount,
    waitlistedCount,
    paidCount,
    byType,
    averageAmount,
    approvalRate,
    waitlistRate,
  };
}

export function getBenefitTypeInfo(type: string) {
  const typeInfo = {
    FUNERAL: {
      label: 'Funeral Benefit',
      icon: '🕊️',
      color: '#8B5CF6',
      description: 'Financial assistance for funeral expenses',
    },
    SICKNESS: {
      label: 'Sickness Benefit',
      icon: '🏥',
      color: '#06B6D4',
      description: 'Financial assistance for medical expenses',
    },
  };
  return typeInfo[type as keyof typeof typeInfo] || typeInfo.FUNERAL;
}

export function getBenefitStatusInfo(status: string) {
  const statusInfo = {
    PENDING: {
      label: 'Pending Review',
      icon: '⏳',
      color: '#F59E0B',
      description: 'Awaiting administrator review',
    },
    APPROVED: {
      label: 'Approved',
      icon: '✅',
      color: '#10B981',
      description: 'Approved and ready for payment',
    },
    REJECTED: {
      label: 'Rejected',
      icon: '❌',
      color: '#EF4444',
      description: 'Request has been rejected',
    },
    WAITLISTED: {
      label: 'Waitlisted',
      icon: '⏸️',
      color: '#6B7280',
      description: 'On waitlist due to insufficient funds',
    },
    PAID: {
      label: 'Paid',
      icon: '💰',
      color: '#3B82F6',
      description: 'Payment has been processed',
    },
  };
  return statusInfo[status as keyof typeof statusInfo] || statusInfo.PENDING;
}

export function formatBenefitAmount(amount: number, currency: string = 'MWK'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatBenefitDate(dateString: string, format: 'short' | 'long' | 'time' = 'short'): string {
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

export function getWaitlistPosition(benefits: Benefit[], benefitId: string): number | null {
  const benefit = benefits.find(b => b.id === benefitId);
  return benefit?.waitlist_position || null;
}

export function getWaitlistStatus(benefit: Benefit): {
  position: number | null;
  daysSinceWaitlisted: number | null;
  status: 'recent' | 'waiting' | 'long_wait';
} {
  const position = benefit.waitlist_position;
  const waitlistedAt = benefit.waitlisted_at;
  
  if (!position || !waitlistedAt) {
    return { position: null, daysSinceWaitlisted: null, status: 'recent' };
  }
  
  const daysSinceWaitlisted = Math.floor(
    (new Date().getTime() - new Date(waitlistedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let status: 'recent' | 'waiting' | 'long_wait' = 'recent';
  if (daysSinceWaitlisted > 30) {
    status = 'long_wait';
  } else if (daysSinceWaitlisted > 7) {
    status = 'waiting';
  }
  
  return { position, daysSinceWaitlisted, status };
}

export function calculateWaitlistImpact(benefits: Benefit[]): {
  totalAmount: number;
  byType: Record<string, number>;
  averageWaitTime: number;
  longestWait: number;
} {
  const waitlistedBenefits = benefits.filter(b => b.status === 'WAITLISTED');
  
  const totalAmount = waitlistedBenefits.reduce((sum, b) => sum + b.amount, 0);
  
  const byType: Record<string, number> = {};
  waitlistedBenefits.forEach(b => {
    byType[b.type] = (byType[b.type] || 0) + b.amount;
  });
  
  const waitTimes = waitlistedBenefits
    .filter(b => b.waitlisted_at)
    .map(b => {
      const waitlistedAt = new Date(b.waitlisted_at!);
      const now = new Date();
      return Math.floor((now.getTime() - waitlistedAt.getTime()) / (1000 * 60 * 60 * 24));
    });
  
  const averageWaitTime = waitTimes.length > 0 
    ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
    : 0;
  
  const longestWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
  
  return {
    totalAmount,
    byType,
    averageWaitTime,
    longestWait,
  };
}

export function generateBenefitReport(benefits: Benefit[]): {
  summary: BenefitStats;
  waitlistImpact: ReturnType<typeof calculateWaitlistImpact>;
  recommendations: string[];
} {
  const summary = calculateBenefitStats(benefits);
  const waitlistImpact = calculateWaitlistImpact(benefits);
  
  const recommendations: string[] = [];
  
  if (summary.waitlistRate > 50) {
    recommendations.push('High waitlist rate - consider increasing benefit limits or reserve balance');
  }
  
  if (summary.approvalRate < 70) {
    recommendations.push('Low approval rate - review benefit criteria and member eligibility');
  }
  
  if (waitlistImpact.averageWaitTime > 30) {
    recommendations.push('Long average wait time - consider faster processing or additional funding');
  }
  
  if (summary.byType.funeral.amount > summary.byType.sickness.amount * 2) {
    recommendations.push('High funeral benefit usage - consider reviewing funeral benefit limits');
  }
  
  if (summary.averageAmount > 50000) {
    recommendations.push('High average benefit amount - review benefit limits and approval criteria');
  }
  
  return {
    summary,
    waitlistImpact,
    recommendations,
  };
}

export function validateBenefitRequest(
  type: string,
  amount: number,
  reason: string,
  maxAmount: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!type || !['FUNERAL', 'SICKNESS'].includes(type)) {
    errors.push('Invalid benefit type');
  }
  
  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (amount > maxAmount) {
    errors.push(`Amount exceeds maximum limit of ${formatBenefitAmount(maxAmount)}`);
  }
  
  if (!reason || reason.trim().length < 10) {
    errors.push('Reason must be at least 10 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getBenefitPriority(benefit: Benefit): 'high' | 'medium' | 'low' {
  // High priority: Funeral benefits, large amounts, urgent reasons
  if (benefit.type === 'FUNERAL') return 'high';
  if (benefit.amount > 100000) return 'high';
  if (benefit.reason.toLowerCase().includes('urgent')) return 'high';
  
  // Medium priority: Sickness benefits, moderate amounts
  if (benefit.type === 'SICKNESS') return 'medium';
  if (benefit.amount > 50000) return 'medium';
  
  // Low priority: Small amounts, non-urgent reasons
  return 'low';
}
