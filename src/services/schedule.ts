import dayjs from 'dayjs';
import { ContributionStrategy } from '../types';

export interface ScheduleParams {
  strategy: ContributionStrategy;
  circleStart: string | Date;
  circleDurationDays: number;        // e.g., 365
  contributionIntervalDays?: number; // for INTERVAL_DAYS
  installmentsPerCircle?: number;    // for INSTALLMENTS_PER_CIRCLE
}

export interface InstallmentInfo {
  index: number;
  dueDate: string;
  isOverdue: boolean;
  daysUntilDue: number;
  daysOverdue: number;
}

/**
 * Compute planned installment dates based on contribution strategy
 */
export function computePlannedInstallments(params: ScheduleParams): string[] {
  const start = dayjs(params.circleStart);
  const end = start.add(params.circleDurationDays, 'day');
  const dates: string[] = [];

  if (params.strategy === 'MONTHLY') {
    let d = start;
    while (d.isBefore(end)) {
      dates.push(d.toISOString());
      d = d.add(1, 'month');
    }
  } else if (params.strategy === 'INTERVAL_DAYS') {
    const step = Math.max(1, params.contributionIntervalDays ?? 30);
    let d = start;
    while (d.isBefore(end)) {
      dates.push(d.toISOString());
      d = d.add(step, 'day');
    }
  } else {
    // INSTALLMENTS_PER_CIRCLE
    const n = Math.max(1, params.installmentsPerCircle ?? 4);
    const step = Math.floor(params.circleDurationDays / n);
    let d = start;
    for (let i = 0; i < n; i++) {
      dates.push(d.toISOString());
      d = d.add(step, 'day');
    }
  }

  return dates;
}

/**
 * Get current period index based on planned dates
 */
export function currentPeriodIndex(plannedDates: string[], asOf: string | Date = new Date()): number {
  const now = dayjs(asOf);
  let idx = 0;
  for (let i = 0; i < plannedDates.length; i++) {
    if (now.isAfter(dayjs(plannedDates[i])) || now.isSame(dayjs(plannedDates[i]))) {
      idx = i;
    }
  }
  return idx;
}

/**
 * Get installment information for a specific period
 */
export function getInstallmentInfo(
  plannedDates: string[],
  periodIndex: number,
  asOf: string | Date = new Date()
): InstallmentInfo | null {
  if (periodIndex < 0 || periodIndex >= plannedDates.length) {
    return null;
  }

  const now = dayjs(asOf);
  const dueDate = dayjs(plannedDates[periodIndex]);
  const isOverdue = now.isAfter(dueDate);
  const daysUntilDue = Math.max(0, dueDate.diff(now, 'day'));
  const daysOverdue = Math.max(0, now.diff(dueDate, 'day'));

  return {
    index: periodIndex,
    dueDate: dueDate.toISOString(),
    isOverdue,
    daysUntilDue,
    daysOverdue,
  };
}

/**
 * Get all installment information for a circle
 */
export function getAllInstallmentInfo(
  plannedDates: string[],
  asOf: string | Date = new Date()
): InstallmentInfo[] {
  return plannedDates.map((date, index) => 
    getInstallmentInfo(plannedDates, index, asOf)!
  );
}

/**
 * Get next due installment
 */
export function getNextDueInstallment(
  plannedDates: string[],
  asOf: string | Date = new Date()
): InstallmentInfo | null {
  const now = dayjs(asOf);
  
  for (let i = 0; i < plannedDates.length; i++) {
    const dueDate = dayjs(plannedDates[i]);
    if (now.isBefore(dueDate)) {
      return getInstallmentInfo(plannedDates, i, asOf);
    }
  }
  
  return null; // All installments are past due
}

/**
 * Get overdue installments
 */
export function getOverdueInstallments(
  plannedDates: string[],
  asOf: string | Date = new Date()
): InstallmentInfo[] {
  const allInfo = getAllInstallmentInfo(plannedDates, asOf);
  return allInfo.filter(info => info.isOverdue);
}

/**
 * Calculate total amount due for a circle
 */
export function calculateTotalCircleAmount(
  contributionAmount: number,
  plannedDates: string[]
): number {
  return contributionAmount * plannedDates.length;
}

/**
 * Calculate remaining amount for a circle
 */
export function calculateRemainingAmount(
  contributionAmount: number,
  plannedDates: string[],
  paidPeriods: number[]
): number {
  const totalAmount = calculateTotalCircleAmount(contributionAmount, plannedDates);
  const paidAmount = paidPeriods.length * contributionAmount;
  return totalAmount - paidAmount;
}

/**
 * Check if a period is fully paid
 */
export function isPeriodFullyPaid(
  periodIndex: number,
  paidPeriods: number[],
  contributionAmount: number,
  actualPayments: { period_index: number; amount: number }[]
): boolean {
  const periodPayments = actualPayments
    .filter(p => p.period_index === periodIndex)
    .reduce((sum, p) => sum + p.amount, 0);
  
  return periodPayments >= contributionAmount;
}

/**
 * Get payment status for a period
 */
export function getPeriodPaymentStatus(
  periodIndex: number,
  paidPeriods: number[],
  contributionAmount: number,
  actualPayments: { period_index: number; amount: number }[]
): 'unpaid' | 'partial' | 'paid' {
  const periodPayments = actualPayments
    .filter(p => p.period_index === periodIndex)
    .reduce((sum, p) => sum + p.amount, 0);
  
  if (periodPayments === 0) return 'unpaid';
  if (periodPayments >= contributionAmount) return 'paid';
  return 'partial';
}
