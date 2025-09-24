import { UserRole } from '../types';

// Role hierarchy levels (higher number = more permissions)
const ROLE_LEVELS = {
  MEMBER: 1,
  AUDITOR: 2,
  CHAIRPERSON: 3,
  TREASURER: 4,
  ADMIN: 5,
  SUPERADMIN: 6,
} as const;

// Check if a role has access to member functions (all roles can)
export const canAccessMemberFunctions = (role: UserRole): boolean => {
  return ['SUPERADMIN', 'ADMIN', 'TREASURER', 'CHAIRPERSON', 'AUDITOR', 'MEMBER'].includes(role);
};

// Check if a role has access to admin functions
export const canAccessAdminFunctions = (role: UserRole): boolean => {
  return ['SUPERADMIN', 'ADMIN'].includes(role);
};

// Check if a role has access to treasurer functions
export const canAccessTreasurerFunctions = (role: UserRole): boolean => {
  return ['SUPERADMIN', 'ADMIN', 'TREASURER'].includes(role);
};

// Check if a role has access to chairperson functions
export const canAccessChairpersonFunctions = (role: UserRole): boolean => {
  return ['SUPERADMIN', 'ADMIN', 'CHAIRPERSON'].includes(role);
};

// Check if a role has access to auditor functions
export const canAccessAuditorFunctions = (role: UserRole): boolean => {
  return ['SUPERADMIN', 'ADMIN', 'AUDITOR'].includes(role);
};

// Check if a role can perform a specific action
export const canPerformAction = (userRole: UserRole, action: string): boolean => {
  switch (action) {
    // Member actions (all roles can do these)
    case 'contribute':
    case 'request_benefit':
    case 'request_loan':
    case 'view_dashboard':
      return canAccessMemberFunctions(userRole);
    
    // Treasurer actions
    case 'disburse_loans':
    case 'record_repayments':
    case 'manage_payments':
      return canAccessTreasurerFunctions(userRole);
    
    // Chairperson actions
    case 'approve_benefits':
    case 'approve_loans':
    case 'manage_approvals':
      return canAccessChairpersonFunctions(userRole);
    
    // Auditor actions
    case 'view_ledger':
    case 'view_reports':
    case 'audit_transactions':
      return canAccessAuditorFunctions(userRole);
    
    // Admin actions
    case 'manage_users':
    case 'manage_settings':
    case 'view_all_data':
      return canAccessAdminFunctions(userRole);
    
    // Superadmin actions
    case 'manage_system':
    case 'access_debug':
      return userRole === 'SUPERADMIN';
    
    default:
      return false;
  }
};

// Get role display name
export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Admin',
    TREASURER: 'Treasurer',
    CHAIRPERSON: 'Chairperson',
    AUDITOR: 'Auditor',
    MEMBER: 'Member',
  };
  return displayNames[role] || role;
};

// Get role description
export const getRoleDescription = (role: UserRole): string => {
  const descriptions = {
    SUPERADMIN: 'Full system access and control',
    ADMIN: 'Group management and user administration',
    TREASURER: 'Financial management and payments',
    CHAIRPERSON: 'Approvals and decision making',
    AUDITOR: 'Financial oversight and reporting',
    MEMBER: 'Basic group participation',
  };
  return descriptions[role] || 'Unknown role';
};

// Check if role A has higher or equal level than role B
export const hasRoleLevel = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
};
