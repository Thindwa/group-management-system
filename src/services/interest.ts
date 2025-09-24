import dayjs from "dayjs";

export function computeLoanTotals(opts: {
  principal: number;
  disbursedAt: string | Date;
  interestPercent: number;       // from settings (e.g., 20)
  loanPeriodDays: number;        // from settings (e.g., 30)
  gracePeriodDays?: number;      // from loan or group
  asOf?: string | Date;          // defaults to now
  payments?: { amount: number; paidAt: string | Date }[];
}) {
  const {
    principal,
    disbursedAt,
    interestPercent,
    loanPeriodDays,
    gracePeriodDays = 0,
    asOf = new Date(),
    payments = [],
  } = opts;

  const disb = dayjs(disbursedAt);
  const now = dayjs(asOf);
  
  // Handle invalid disbursedAt by using current date
  if (!disb.isValid()) {
    console.warn('Invalid disbursedAt, using current date:', disbursedAt);
    const currentDate = dayjs();
    const dueAt = currentDate.add(loanPeriodDays, "day");
    const graceEndAt = dueAt.add(gracePeriodDays, "day");
    
    return {
      dueAt: dueAt.toISOString(),
      graceEndAt: graceEndAt.toISOString(),
      periods: 1,
      interestPercent,
      loanPeriodDays,
      grossDue: Math.round(principal * (1 + Math.max(0, Number(interestPercent)) / 100)),
      paid: payments.reduce((s, p) => s + p.amount, 0),
      outstanding: Math.round(principal * (1 + Math.max(0, Number(interestPercent)) / 100)),
      inGrace: true,
      overdueBlocks: 0,
    };
  }
  
  const dueAt = disb.add(loanPeriodDays, "day");
  const graceEndAt = dueAt.add(gracePeriodDays, "day");

  let periods = 1; // base period always applies
  if (now.isAfter(graceEndAt)) {
    const extraDays = now.diff(graceEndAt, "day");
    const extraBlocks = Math.ceil(extraDays / loanPeriodDays);
    periods += extraBlocks;
  }

  const rate = Math.max(0, Number(interestPercent)) / 100;
  const grossDue = principal * (1 + rate * periods);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, Math.round(grossDue - paid));

  return {
    dueAt: dueAt.toISOString(),
    graceEndAt: graceEndAt.toISOString(),
    periods,
    interestPercent,
    loanPeriodDays,
    grossDue: Math.round(grossDue),
    paid,
    outstanding,
    inGrace: now.isBefore(graceEndAt) || now.isSame(graceEndAt),
    overdueBlocks: Math.max(0, periods - 1),
  };
}
