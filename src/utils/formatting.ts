// Currency formatting utilities
export const formatCurrency = (amount: number, currency: string = 'MWK'): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

// Date formatting utilities
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Date formatting error:', error, 'for date:', dateString);
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateString: string | Date): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Date formatting error:', error, 'for date:', dateString);
    return 'Invalid Date';
  }
};

// Status formatting utilities
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    WAITLISTED: 'Waitlisted',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    DEFAULTED: 'Defaulted',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
    CLOSED: 'Closed',
  };
  
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: '#F59E0B',
    APPROVED: '#10B981',
    REJECTED: '#EF4444',
    WAITLISTED: '#6B7280',
    ACTIVE: '#3B82F6',
    COMPLETED: '#10B981',
    DEFAULTED: '#EF4444',
    PAID: '#10B981',
    OVERDUE: '#EF4444',
    CLOSED: '#6B7280',
  };
  
  return colors[status] || '#6B7280';
};

// Role formatting utilities
export const formatRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Admin',
    TREASURER: 'Treasurer',
    CHAIRPERSON: 'Chairperson',
    AUDITOR: 'Auditor',
    MEMBER: 'Member',
  };
  
  return roleMap[role] || role;
};

// Number formatting utilities
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export const formatPercentage = (num: number): string => {
  return `${num}%`;
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +265 XX XXX XXXX for Malawi
  if (cleaned.length === 12 && cleaned.startsWith('265')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  // Format as XX XXX XXXX for local numbers
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone; // Return original if can't format
};

// Relative type formatting
export const formatRelativeType = (type: string): string => {
  const typeMap: Record<string, string> = {
    mother: 'Mother',
    father: 'Father',
    sister: 'Sister',
    brother: 'Brother',
    child: 'Child',
    husband: 'Husband',
    wife: 'Wife',
    grandmother: 'Grandmother',
    grandfather: 'Grandfather',
    uncle: 'Uncle',
    aunt: 'Aunt',
    cousin: 'Cousin',
    nephew: 'Nephew',
    niece: 'Niece',
  };
  
  return typeMap[type.toLowerCase()] || type;
};

// Payment method formatting
export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    cheque: 'Cheque',
  };
  
  return methodMap[method] || method.replace('_', ' ').toUpperCase();
};
