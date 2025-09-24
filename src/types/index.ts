// User roles and permissions
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TREASURER' | 'CHAIRPERSON' | 'AUDITOR' | 'MEMBER';

export type ContributionStrategy = 'MONTHLY' | 'INTERVAL_DAYS' | 'INSTALLMENTS_PER_CIRCLE';

export interface Permission {
  canCreateGroups: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  canApproveBenefits: boolean;
  canApproveLoans: boolean;
  canManagePayments: boolean;
  canManagePayouts: boolean;
  canManageLoans: boolean;
  canReconcile: boolean;
  canExport: boolean;
  canViewReports: boolean;
  canGrantGracePeriods: boolean;
  canViewLedger: boolean;
}

// Database models
export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email?: string; // This will be populated from auth system
  role: UserRole;
  group_id: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface GroupSettings {
  id: string;
  group_id: string;
  circle_duration_days: number;
  contribution_amount_default: number;
  contribution_strategy: ContributionStrategy;
  contribution_interval_days: number;
  installments_per_circle: number;
  allow_member_override: boolean;
  funeral_benefit: number;
  sickness_benefit: number;
  allowed_relatives: string[];
  loan_interest_percent: number;
  loan_period_days: number;
  grace_period_days: number;
  reserve_min_balance: number;
  auto_waitlist_if_insufficient: boolean;
  auto_waitlist_processing: boolean;
  waitlist_policy: 'FIFO' | 'BENEFITS_FIRST' | 'LOANS_FIRST';
  created_at: string;
  updated_at?: string;
}

export interface MemberSettings {
  id: string;
  member_id: string;
  contribution_amount_override: number | null;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Circle {
  id: string;
  group_id: string;
  year: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'CLOSED';
  created_at: string;
  updated_at?: string;
}

export interface Contribution {
  id: string;
  group_id: string;
  circle_id: string;
  member_id: string;
  period_index: number; // 0-based planned installment index
  planned_installments: number; // snapshot for this circle/member at payment time
  amount: number;
  method: 'cash' | 'bank_transfer' | 'mobile_money';
  note?: string;
  attachment_url?: string;
  contribution_amount_snapshot: number; // snapshot of effective amount per installment at time of payment
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  confirmed_by?: string;
  confirmed_at?: string;
  rejection_reason?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  // Additional fields for UI
  due_date?: string;
  paid_at?: string;
  paid_by?: string;
  quarter?: string;
  payment_method?: 'cash' | 'bank_transfer' | 'mobile_money';
  member_name?: string;
}

export interface Benefit {
  id: string;
  group_id: string;
  circle_id: string;
  member_id: string;
  type: 'FUNERAL' | 'SICKNESS';
  relative_type: string;
  relative_name: string;
  requested_amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED' | 'WAITLISTED';
  attachments?: string[];
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  paid_by?: string;
  paid_at?: string;
  waitlist_position?: number;
  waitlisted_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Loan {
  id: string;
  group_id: string;
  circle_id: string;
  borrower_id: string;
  principal: number;
  disbursed_by?: string;
  disbursed_at?: string;
  due_at?: string;
  status: 'ACTIVE' | 'WAITLISTED' | 'CLOSED' | 'OVERDUE';
  grace_period_days?: number;
  grace_source: 'DEFAULT' | 'OVERRIDE' | 'ADJUSTED';
  grace_adjusted_by?: string;
  grace_adjusted_at?: string;
  notes?: string;
  waitlist_position?: number;
  waitlisted_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  amount: number;
  paid_at: string;
  method: 'cash' | 'bank_transfer' | 'mobile_money';
  note?: string;
  created_by: string;
  created_at: string;
}

export interface LoanEvent {
  id: string;
  loan_id: string;
  type: 'CREATED' | 'DISBURSED' | 'GRACE_SET' | 'GRACE_EXTENDED' | 'PAYMENT' | 'CLOSED' | 'REOPENED';
  data: Record<string, any>;
  actor_id: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  group_id: string;
  circle_id: string;
  member_id: string | null;
  type: 'CONTRIBUTION_IN' | 'BENEFIT_OUT' | 'LOAN_OUT' | 'LOAN_REPAYMENT_IN' | 'ADJUSTMENT';
  ref_id: string;
  amount: number;
  direction: 'IN' | 'OUT';
  created_at: string;
  created_by: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  payload: Record<string, any>;
  created_at: string;
}

// UI State types
export interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GroupState {
  currentGroup: Group | null;
  currentCircle: Circle | null;
  settings: GroupSettings | null;
  members: Profile[];
  isLoading: boolean;
  error: string | null;
}

export interface LoanCalculation {
  dueAt: string;
  graceEndAt: string;
  periods: number;
  grossDue: number;
  paid: number;
  outstanding: number;
  inGrace: boolean;
  overdueBlocks: number;
}

export interface BalanceInfo {
  available: number;
  reserve: number;
  spendable: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  confirmPassword: string;
}

export interface CreateGroupForm {
  name: string;
  currency: string;
  circle_start_date: string;
  quarterly_contribution: number;
  funeral_benefit: number;
  sickness_benefit: number;
  grace_period_days: number;
}

export interface ContributionForm {
  member_id: string;
  period_index: number;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'mobile_money';
  note?: string;
  attachment?: File;
}

export interface BenefitRequestForm {
  type: 'funeral' | 'sickness';
  relative_type: string;
  relative_name: string;
  requested_amount: number;
  attachments?: File[];
}

export interface LoanForm {
  borrower_id: string;
  principal: number;
  grace_period_days?: number;
  note?: string;
}

export interface LoanPaymentForm {
  amount: number;
  method: 'cash' | 'bank_transfer' | 'mobile_money';
  note?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  GroupSettings: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  MemberProfile: { memberId: string };
  ContributionDetails: { contributionId: string };
  BenefitDetails: { benefitId: string };
  LoanDetails: { loanId: string };
  CreateLoan: undefined;
  CreateBenefit: undefined;
  CreateContribution: undefined;
  Reports: undefined;
  AuditLog: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Contributions: undefined;
  Benefits: undefined;
  Loans: undefined;
  Members: undefined;
  Reports: undefined;
};

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Notification types
export interface NotificationData {
  type: 'contribution_due' | 'benefit_approved' | 'loan_approved' | 'loan_overdue' | 'payment_received';
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Chart data types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ContributionChartData {
  quarterly: ChartDataPoint[];
  monthly: ChartDataPoint[];
  memberBreakdown: ChartDataPoint[];
}

export interface LoanChartData {
  outstanding: ChartDataPoint[];
  overdue: ChartDataPoint[];
  interestAccrued: ChartDataPoint[];
}

// Export types
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includeDetails: boolean;
}

export interface ReportData {
  title: string;
  generatedAt: string;
  period: string;
  summary: {
    totalContributions: number;
    totalBenefits: number;
    totalLoans: number;
    totalRepayments: number;
    netBalance: number;
  };
  contributions: Contribution[];
  benefits: Benefit[];
  loans: Loan[];
  payments: LoanPayment[];
}
