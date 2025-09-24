import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Loan, GroupSettings } from '../../types';
import { computeLoanTotals } from '../services/interest';

interface LoanStatsCardProps {
  loan: Loan;
  groupSettings?: GroupSettings;
  payments?: any[];
}

export default function LoanStatsCard({ loan, groupSettings, payments = [] }: LoanStatsCardProps) {
  const loanTotals = computeLoanTotals({
    principal: loan.principal,
    disbursedAt: loan.disbursed_at || new Date().toISOString(),
    interestPercent: groupSettings?.loan_interest_percent || 0,
    loanPeriodDays: groupSettings?.loan_period_days || 30,
    gracePeriodDays: groupSettings?.grace_period_days || 5,
    payments: payments.map(p => ({ amount: p.amount, paidAt: p.paid_at }))
  });

  const formatCurrency = (amount: number) => `MK ${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const interestAmount = loanTotals.grossDue - loan.principal;
  const interestRate = groupSettings?.loan_interest_percent || 0;
  const daysOverdue = loanTotals.overdueBlocks > 0 ? 
    (loanTotals.overdueBlocks - 1) * (groupSettings?.loan_period_days || 30) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loan Details & Interest</Text>
      
      {/* Basic Loan Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Principal Amount:</Text>
          <Text style={styles.value}>{formatCurrency(loan.principal)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Interest Rate:</Text>
          <Text style={styles.value}>{interestRate}% per period</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Loan Period:</Text>
          <Text style={styles.value}>{groupSettings?.loan_period_days || 30} days</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Grace Period:</Text>
          <Text style={styles.value}>{groupSettings?.grace_period_days || 5} days</Text>
        </View>
        {loan.disbursed_at && (
          <View style={styles.row}>
            <Text style={styles.label}>Disbursed Date:</Text>
            <Text style={styles.value}>{formatDate(loan.disbursed_at)}</Text>
          </View>
        )}
      </View>

      {/* Interest Calculations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interest Calculations</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Interest Amount:</Text>
          <Text style={[styles.value, styles.interestAmount]}>
            {formatCurrency(interestAmount)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Due (Principal + Interest):</Text>
          <Text style={[styles.value, styles.totalDue]}>
            {formatCurrency(loanTotals.grossDue)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Interest Periods:</Text>
          <Text style={styles.value}>{loanTotals.periods} period(s)</Text>
        </View>
        {loanTotals.overdueBlocks > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Overdue Periods:</Text>
            <Text style={[styles.value, styles.overdue]}>
              {loanTotals.overdueBlocks} period(s)
            </Text>
          </View>
        )}
      </View>

      {/* Payment Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Status</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Amount Paid:</Text>
          <Text style={[styles.value, styles.paid]}>
            {formatCurrency(loanTotals.paid)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Outstanding Balance:</Text>
          <Text style={[styles.value, styles.outstanding]}>
            {formatCurrency(loanTotals.outstanding)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Progress:</Text>
          <Text style={styles.value}>
            {((loanTotals.paid / loanTotals.grossDue) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Due Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Dates</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Due Date:</Text>
          <Text style={styles.value}>{formatDate(loanTotals.dueAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Grace Period Ends:</Text>
          <Text style={styles.value}>{formatDate(loanTotals.graceEndAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[
            styles.value,
            loanTotals.inGrace ? styles.inGrace : 
            loanTotals.overdueBlocks > 0 ? styles.overdue : styles.onTime
          ]}>
            {loanTotals.inGrace ? 'In Grace Period' : 
             loanTotals.overdueBlocks > 0 ? 'Overdue' : 'On Time'}
          </Text>
        </View>
      </View>

      {/* Interest Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interest Breakdown</Text>
        <View style={styles.breakdown}>
          <Text style={styles.breakdownText}>
            • Base interest: {interestRate}% on {formatCurrency(loan.principal)}
          </Text>
          <Text style={styles.breakdownText}>
            • Interest per period: {formatCurrency(interestAmount / loanTotals.periods)}
          </Text>
          <Text style={styles.breakdownText}>
            • Total periods: {loanTotals.periods}
          </Text>
          {loanTotals.overdueBlocks > 0 && (
            <Text style={[styles.breakdownText, styles.overdue]}>
              • Additional overdue periods: {loanTotals.overdueBlocks - 1}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  interestAmount: {
    color: '#059669',
  },
  totalDue: {
    color: '#DC2626',
    fontSize: 16,
  },
  paid: {
    color: '#059669',
  },
  outstanding: {
    color: '#DC2626',
  },
  overdue: {
    color: '#DC2626',
  },
  inGrace: {
    color: '#D97706',
  },
  onTime: {
    color: '#059669',
  },
  breakdown: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  breakdownText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
});
