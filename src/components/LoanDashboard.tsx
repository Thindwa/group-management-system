import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Loan, GroupSettings } from '../../types';
import { computeLoanTotals } from '../services/interest';

interface LoanDashboardProps {
  loans: Loan[];
  groupSettings?: GroupSettings;
  payments: Record<string, any[]>;
}

export default function LoanDashboard({ loans, groupSettings, payments }: LoanDashboardProps) {
  const formatCurrency = (amount: number) => `MK ${amount.toLocaleString()}`;

  // Calculate comprehensive loan statistics
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const closedLoans = loans.filter(l => l.status === 'CLOSED');
  const waitlistedLoans = loans.filter(l => l.status === 'WAITLISTED');

  let totalPrincipal = 0;
  let totalInterestEarned = 0;
  let totalInterestOutstanding = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let totalInterestCollected = 0;
  let overdueLoans = 0;
  let loansInGrace = 0;

  // Process active loans
  activeLoans.forEach(loan => {
    if (loan.disbursed_at) {
      const loanTotals = computeLoanTotals({
        principal: loan.principal,
        disbursedAt: loan.disbursed_at,
        interestPercent: groupSettings?.loan_interest_percent || 0,
        loanPeriodDays: groupSettings?.loan_period_days || 30,
        gracePeriodDays: groupSettings?.grace_period_days || 5,
        payments: (payments[loan.id] || []).map(p => ({ amount: p.amount, paidAt: p.paid_at }))
      });

      totalPrincipal += loan.principal;
      const interestAmount = loanTotals.grossDue - loan.principal;
      totalInterestOutstanding += interestAmount;
      totalOutstanding += loanTotals.outstanding;
      totalPaid += loanTotals.paid;
      totalInterestCollected += loanTotals.paid - loan.principal;

      if (loanTotals.overdueBlocks > 0) {
        overdueLoans++;
      } else if (loanTotals.inGrace) {
        loansInGrace++;
      }
    }
  });

  // Process closed loans
  closedLoans.forEach(loan => {
    if (loan.disbursed_at) {
      const loanTotals = computeLoanTotals({
        principal: loan.principal,
        disbursedAt: loan.disbursed_at,
        interestPercent: groupSettings?.loan_interest_percent || 0,
        loanPeriodDays: groupSettings?.loan_period_days || 30,
        gracePeriodDays: groupSettings?.grace_period_days || 5,
        payments: (payments[loan.id] || []).map(p => ({ amount: p.amount, paidAt: p.paid_at }))
      });

      totalPrincipal += loan.principal;
      const interestAmount = loanTotals.grossDue - loan.principal;
      totalInterestEarned += interestAmount;
      totalPaid += loanTotals.paid;
      totalInterestCollected += loanTotals.paid - loan.principal;
    }
  });

  const totalInterestPotential = totalInterestEarned + totalInterestOutstanding;
  const averageLoanSize = loans.length > 0 ? totalPrincipal / loans.length : 0;
  const interestRate = groupSettings?.loan_interest_percent || 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Loan Dashboard</Text>
      
      {/* Summary Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Loans</Text>
          <Text style={styles.cardValue}>{loans.length}</Text>
          <Text style={styles.cardSubtext}>
            Active: {activeLoans.length} | Closed: {closedLoans.length}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Principal</Text>
          <Text style={styles.cardValue}>{formatCurrency(totalPrincipal)}</Text>
          <Text style={styles.cardSubtext}>
            Avg: {formatCurrency(averageLoanSize)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Interest Rate</Text>
          <Text style={styles.cardValue}>{interestRate}%</Text>
          <Text style={styles.cardSubtext}>Per {groupSettings?.loan_period_days || 30} days</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Interest Earned</Text>
          <Text style={[styles.cardValue, styles.positive]}>
            {formatCurrency(totalInterestEarned)}
          </Text>
          <Text style={styles.cardSubtext}>
            Collected: {formatCurrency(totalInterestCollected)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Interest Outstanding</Text>
          <Text style={[styles.cardValue, styles.outstanding]}>
            {formatCurrency(totalInterestOutstanding)}
          </Text>
          <Text style={styles.cardSubtext}>
            Potential: {formatCurrency(totalInterestPotential)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Status</Text>
          <Text style={styles.cardValue}>{formatCurrency(totalPaid)}</Text>
          <Text style={styles.cardSubtext}>
            Outstanding: {formatCurrency(totalOutstanding)}
          </Text>
        </View>
      </View>

      {/* Loan Status Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Status Breakdown</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Active Loans:</Text>
          <Text style={styles.statusValue}>{activeLoans.length}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Closed Loans:</Text>
          <Text style={styles.statusValue}>{closedLoans.length}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Waitlisted Loans:</Text>
          <Text style={styles.statusValue}>{waitlistedLoans.length}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Overdue Loans:</Text>
          <Text style={[styles.statusValue, styles.overdue]}>{overdueLoans}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Loans in Grace:</Text>
          <Text style={[styles.statusValue, styles.grace]}>{loansInGrace}</Text>
        </View>
      </View>

      {/* Interest Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interest Analysis</Text>
        <View style={styles.analysisContainer}>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Interest Collection Rate:</Text>
            <Text style={styles.analysisValue}>
              {totalInterestPotential > 0 ? 
                ((totalInterestCollected / totalInterestPotential) * 100).toFixed(1) : 0}%
            </Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Average Interest per Loan:</Text>
            <Text style={styles.analysisValue}>
              {loans.length > 0 ? 
                formatCurrency(totalInterestPotential / loans.length) : 
                formatCurrency(0)}
            </Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Interest as % of Principal:</Text>
            <Text style={styles.analysisValue}>
              {totalPrincipal > 0 ? 
                ((totalInterestPotential / totalPrincipal) * 100).toFixed(1) : 0}%
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Loan Success Rate:</Text>
            <Text style={styles.metricValue}>
              {loans.length > 0 ? 
                ((closedLoans.length / loans.length) * 100).toFixed(1) : 0}%
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Average Repayment Time:</Text>
            <Text style={styles.metricValue}>
              {groupSettings?.loan_period_days || 30} days
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Grace Period Utilization:</Text>
            <Text style={styles.metricValue}>
              {activeLoans.length > 0 ? 
                ((loansInGrace / activeLoans.length) * 100).toFixed(1) : 0}%
            </Text>
          </View>
        </View>
      </View>

      {/* Loan Terms Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Loan Terms</Text>
        <View style={styles.termsContainer}>
          <View style={styles.termItem}>
            <Text style={styles.termLabel}>Interest Rate:</Text>
            <Text style={styles.termValue}>{interestRate}% per period</Text>
          </View>
          <View style={styles.termItem}>
            <Text style={styles.termLabel}>Loan Period:</Text>
            <Text style={styles.termValue}>{groupSettings?.loan_period_days || 30} days</Text>
          </View>
          <View style={styles.termItem}>
            <Text style={styles.termLabel}>Grace Period:</Text>
            <Text style={styles.termValue}>{groupSettings?.grace_period_days || 5} days</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  positive: {
    color: '#059669',
  },
  outstanding: {
    color: '#DC2626',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  overdue: {
    color: '#DC2626',
  },
  grace: {
    color: '#D97706',
  },
  analysisContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  metricsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  termsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  termItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  termLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  termValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
