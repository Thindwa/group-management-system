import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Contribution } from '../types';

interface ContributionSummaryProps {
  contributions: Contribution[];
  expectedAmount: number;
  totalPeriods: number;
}

export default function ContributionSummary({
  contributions,
  expectedAmount,
  totalPeriods,
}: ContributionSummaryProps) {
  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };


  // Only consider CONFIRMED contributions for calculations
  const confirmedContributions = contributions.filter(c => c.status === 'CONFIRMED');

  // Safety checks with fallbacks
  if (totalPeriods === 0) {
    totalPeriods = 4; // Fallback to 4 periods
  }

  if (expectedAmount === 0) {
    expectedAmount = 10000; // Fallback to 10000 MWK
  }

  const calculateSummary = () => {
    const totalPaid = confirmedContributions.reduce((sum, c) => sum + c.amount, 0);
    
    // Calculate total expected based on actual contribution amounts set for each period
    // Group contributions by period to see what was expected for each period
    const periodContributions: Record<number, Contribution[]> = {};
    confirmedContributions.forEach(c => {
      if (!periodContributions[c.period_index]) {
        periodContributions[c.period_index] = [];
      }
      periodContributions[c.period_index].push(c);
    });

    // Calculate total expected by summing up the expected amounts for each period
    // If a period has contributions, use the contribution_amount_snapshot as the expected amount
    // If a period has no contributions, use the default expectedAmount
    let totalExpected = 0;
    for (let i = 0; i < totalPeriods; i++) {
      const periodContribs = periodContributions[i] || [];
      if (periodContribs.length > 0) {
        // Use the contribution_amount_snapshot from the first contribution in this period
        totalExpected += periodContribs[0].contribution_amount_snapshot || expectedAmount;
      } else {
        // No contributions for this period, use default expected amount
        totalExpected += expectedAmount;
      }
    }
    
    const remaining = Math.max(0, totalExpected - totalPaid);
    const completionPercentage = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;
    
    // Calculate periods paid (only confirmed contributions)
    const periodsPaid = new Set(confirmedContributions.map(c => c.period_index)).size;
    const periodsRemaining = totalPeriods - periodsPaid;
    
    // Calculate arrears using the actual expected amounts per period
    let arrearsPeriods = 0;
    let arrearsAmount = 0;

    for (let i = 0; i < totalPeriods; i++) {
      const periodContribs = periodContributions[i] || [];
      const periodPaid = periodContribs.reduce((sum, c) => sum + c.amount, 0);
      
      // Get the expected amount for this period
      const periodExpected = periodContribs.length > 0 
        ? (periodContribs[0].contribution_amount_snapshot || expectedAmount)
        : expectedAmount;
      
      if (periodPaid < periodExpected) {
        arrearsPeriods++;
        arrearsAmount += periodExpected - periodPaid;
      }
    }

    return {
      totalPaid,
      totalExpected,
      remaining,
      completionPercentage,
      periodsPaid,
      periodsRemaining,
      arrearsPeriods,
      arrearsAmount,
    };
  };

  const summary = calculateSummary();

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 100) return '#10B981';
    if (percentage >= 75) return '#F59E0B';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getCompletionStatus = (percentage: number) => {
    if (percentage >= 100) return 'Complete';
    if (percentage >= 75) return 'Good Progress';
    if (percentage >= 50) return 'Halfway';
    if (percentage >= 25) return 'Getting Started';
    return 'Behind';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contribution Summary</Text>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(100, summary.completionPercentage)}%`,
                backgroundColor: getCompletionColor(summary.completionPercentage)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {summary.completionPercentage.toFixed(1)}% Complete
        </Text>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {getCompletionStatus(summary.completionPercentage)}
        </Text>
      </View>

      {/* Financial Summary */}
      <View style={styles.financialContainer}>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Total Expected:</Text>
          <Text style={styles.financialValue}>{formatCurrency(summary.totalExpected)}</Text>
        </View>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Total Paid:</Text>
          <Text style={[styles.financialValue, { color: '#10B981' }]}>
            {formatCurrency(summary.totalPaid)}
          </Text>
        </View>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Remaining:</Text>
          <Text style={[styles.financialValue, { color: summary.remaining > 0 ? '#EF4444' : '#10B981' }]}>
            {formatCurrency(summary.remaining)}
          </Text>
        </View>
      </View>

      {/* Period Summary */}
      <View style={styles.periodContainer}>
        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>Periods Paid:</Text>
          <Text style={styles.periodValue}>{summary.periodsPaid} / {totalPeriods}</Text>
        </View>
        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>Periods Remaining:</Text>
          <Text style={styles.periodValue}>{summary.periodsRemaining}</Text>
        </View>
      </View>

      {/* Arrears Summary */}
      {summary.arrearsPeriods > 0 && (
        <View style={styles.arrearsContainer}>
          <Text style={styles.arrearsTitle}>Arrears</Text>
          <View style={styles.arrearsRow}>
            <Text style={styles.arrearsLabel}>Overdue Periods:</Text>
            <Text style={[styles.arrearsValue, { color: '#EF4444' }]}>
              {summary.arrearsPeriods}
            </Text>
          </View>
          <View style={styles.arrearsRow}>
            <Text style={styles.arrearsLabel}>Amount Owed:</Text>
            <Text style={[styles.arrearsValue, { color: '#EF4444' }]}>
              {formatCurrency(summary.arrearsAmount)}
            </Text>
          </View>
        </View>
      )}

      {/* Payment Methods Summary */}
      <View style={styles.methodsContainer}>
        <Text style={styles.methodsTitle}>Payment Methods Used</Text>
        {(() => {
          const methodCounts: Record<string, number> = {};
          confirmedContributions.forEach(c => {
            methodCounts[c.method] = (methodCounts[c.method] || 0) + 1;
          });
          
          return Object.entries(methodCounts).map(([method, count]) => (
            <View key={method} style={styles.methodRow}>
              <Text style={styles.methodLabel}>{method.replace('_', ' ').toUpperCase()}:</Text>
              <Text style={styles.methodValue}>{count} payments</Text>
            </View>
          ));
        })()}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
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
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  financialContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  periodContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  periodValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  arrearsContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  arrearsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  arrearsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  arrearsLabel: {
    fontSize: 14,
    color: '#DC2626',
  },
  arrearsValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  methodsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
  },
  methodsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  methodValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
});