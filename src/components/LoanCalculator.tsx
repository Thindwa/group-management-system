import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Loan, LoanPayment, GroupSettings } from '../types';
import { computeLoanTotals } from '../services/interest';

interface LoanCalculatorProps {
  loan: Loan;
  payments?: LoanPayment[];
  showDetails?: boolean;
  groupSettings?: GroupSettings;
}

export default function LoanCalculator({ loan, payments = [], showDetails = false, groupSettings }: LoanCalculatorProps) {
  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
  };

  const loanTotals = computeLoanTotals({
    principal: loan.principal,
    disbursedAt: loan.disbursed_at || loan.created_at,
    interestPercent: groupSettings?.loan_interest_percent || 20,
    loanPeriodDays: groupSettings?.loan_period_days || 30,
    gracePeriodDays: loan.grace_period_days || groupSettings?.grace_period_days || 0,
    asOf: new Date(),
    payments: payments.map(p => ({
      amount: p.amount,
      paidAt: p.created_at
    }))
  });

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: '#F59E0B',
      APPROVED: '#10B981',
      REJECTED: '#EF4444',
      WAITLISTED: '#6B7280',
      ACTIVE: '#3B82F6',
      COMPLETED: '#10B981',
      DEFAULTED: '#EF4444',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const getStatusText = (status: string) => {
    const texts = {
      PENDING: 'Pending Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      WAITLISTED: 'Waitlisted',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      DEFAULTED: 'Defaulted',
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loan Calculator</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) }]}>
          <Text style={styles.statusText}>{getStatusText(loan.status)}</Text>
        </View>
      </View>

      {/* Loan Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Principal Amount:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(loan.principal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Interest Rate:</Text>
          <Text style={styles.summaryValue}>{groupSettings?.loan_interest_percent || 20}%</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Loan Period:</Text>
          <Text style={styles.summaryValue}>{groupSettings?.loan_period_days || 30} days</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Grace Period:</Text>
          <Text style={styles.summaryValue}>{loan.grace_period_days} days</Text>
        </View>
      </View>

      {/* Calculation Results */}
      <View style={styles.calculationContainer}>
        <Text style={styles.calculationTitle}>Loan Calculation</Text>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Total Interest:</Text>
          <Text style={styles.calculationValue}>
            {formatCurrency(loanTotals.grossDue - loan.principal)}
          </Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Total Amount Due:</Text>
          <Text style={[styles.calculationValue, styles.totalAmount]}>
            {formatCurrency(loanTotals.grossDue)}
          </Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Amount Paid:</Text>
          <Text style={[styles.calculationValue, styles.paidAmount]}>
            {formatCurrency(loanTotals.paid)}
          </Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Outstanding Balance:</Text>
          <Text style={[styles.calculationValue, styles.outstandingAmount]}>
            {formatCurrency(loanTotals.outstanding)}
          </Text>
        </View>
      </View>

      {/* Payment Schedule */}
      {showDetails && (
        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleTitle}>Payment Schedule</Text>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Due Date:</Text>
            <Text style={styles.scheduleValue}>
              {formatDate(loanTotals.dueAt)}
            </Text>
          </View>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Grace End Date:</Text>
            <Text style={styles.scheduleValue}>
              {formatDate(loanTotals.graceEndAt)}
            </Text>
          </View>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>In Grace Period:</Text>
            <Text style={[styles.scheduleValue, loanTotals.inGrace ? styles.yesText : styles.noText]}>
              {loanTotals.inGrace ? 'Yes' : 'No'}
            </Text>
          </View>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Overdue Blocks:</Text>
            <Text style={[styles.scheduleValue, loanTotals.overdueBlocks > 0 ? styles.overdueText : styles.onTimeText]}>
              {loanTotals.overdueBlocks}
            </Text>
          </View>
        </View>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <View style={styles.paymentsContainer}>
          <Text style={styles.paymentsTitle}>Payment History</Text>
          {payments.map((payment, index) => (
            <View key={index} style={styles.paymentItem}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>
                  {formatCurrency(payment.amount)}
                </Text>
                <Text style={styles.paymentDate}>
                  {formatDate(payment.created_at)}
                </Text>
              </View>
              <Text style={styles.paymentMethod}>
                {payment.method.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Repayment Progress</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(100, (loanTotals.paid / loanTotals.grossDue) * 100)}%`,
                backgroundColor: loanTotals.outstanding <= 0 ? '#10B981' : '#3B82F6'
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {((loanTotals.paid / loanTotals.grossDue) * 100).toFixed(1)}% Complete
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  calculationContainer: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#059669',
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paidAmount: {
    color: '#10B981',
  },
  outstandingAmount: {
    color: '#EF4444',
  },
  scheduleContainer: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#1E40AF',
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  yesText: {
    color: '#10B981',
  },
  noText: {
    color: '#EF4444',
  },
  overdueText: {
    color: '#EF4444',
  },
  onTimeText: {
    color: '#10B981',
  },
  paymentsContainer: {
    marginBottom: 16,
  },
  paymentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
