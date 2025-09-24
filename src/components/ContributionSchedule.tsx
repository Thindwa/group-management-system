import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Contribution } from '../types';
import { computePlannedInstallments, currentPeriodIndex } from '../services/schedule';

interface ContributionScheduleProps {
  contributions: Contribution[];
  plannedInstallments: string[];
  expectedAmount: number;
  memberId: string;
}

export default function ContributionSchedule({
  contributions,
  plannedInstallments,
  expectedAmount,
  memberId,
}: ContributionScheduleProps) {
  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getContributionStatus = (periodIndex: number) => {
    // Only consider CONFIRMED contributions for status calculation
    const periodContributions = contributions.filter(c => 
      c.period_index === periodIndex && c.status === 'CONFIRMED'
    );
    
    if (periodContributions.length === 0) {
      // Check if period is overdue
      const periodDate = new Date(plannedInstallments[periodIndex]);
      const now = new Date();
      return now > periodDate ? 'overdue' : 'pending';
    }

    // Calculate total paid for this period (only confirmed contributions)
    const totalPaid = periodContributions.reduce((sum, c) => sum + c.amount, 0);

    if (totalPaid >= expectedAmount) {
      return 'paid';
    } else if (totalPaid > 0) {
      return 'partial';
    } else {
      return 'pending';
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      paid: '#10B981',
      partial: '#F59E0B',
      overdue: '#EF4444',
      pending: '#6B7280',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const getStatusText = (status: string) => {
    const texts = {
      paid: 'Paid',
      partial: 'Partial',
      overdue: 'Overdue',
      pending: 'Pending',
    };
    return texts[status as keyof typeof texts] || 'Unknown';
  };

  const currentPeriod = currentPeriodIndex(plannedInstallments);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Contribution Schedule</Text>
        <Text style={styles.scrollHint}>← Scroll to see more periods →</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContentContainer}
        decelerationRate="fast"
        snapToInterval={208} // 200px width + 8px margin
        snapToAlignment="start"
      >
        <View style={styles.scheduleContainer}>
          {plannedInstallments.map((installment, index) => {
            const status = getContributionStatus(index);
            const isCurrent = index === currentPeriod;
            const isOverdue = status === 'overdue';
            // Only consider CONFIRMED contributions for amount calculations
            const periodContributions = contributions.filter(c => 
              c.period_index === index && c.status === 'CONFIRMED'
            );
            const totalPaid = periodContributions.reduce((sum, c) => sum + c.amount, 0);
            const remaining = Math.max(0, expectedAmount - totalPaid);

            return (
              <View key={index} style={[
                styles.periodCard,
                isCurrent && styles.currentPeriodCard,
                isOverdue && styles.overduePeriodCard
              ]}>
                <View style={styles.periodHeader}>
                  <Text style={styles.periodNumber}>Period {index + 1}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                    <Text style={styles.statusText}>{getStatusText(status)}</Text>
                  </View>
                </View>
                
                <Text style={styles.dueDate}>{formatDate(installment)}</Text>
                
                <View style={styles.amountContainer}>
                  <Text style={styles.expectedAmount}>
                    Expected: {formatCurrency(expectedAmount)}
                  </Text>
                  <Text style={styles.paidAmount}>
                    Paid: {formatCurrency(totalPaid)}
                  </Text>
                  {remaining > 0 && (
                    <Text style={styles.remainingAmount}>
                      Remaining: {formatCurrency(remaining)}
                    </Text>
                  )}
                </View>

                {(() => {
                  // Show all contributions for this period (including pending ones)
                  const allPeriodContributions = contributions.filter(c => c.period_index === index);
                  return allPeriodContributions.length > 0 && (
                    <View style={styles.contributionsList}>
                      {allPeriodContributions.map((contribution, idx) => (
                        <View key={idx} style={styles.contributionItem}>
                          <View style={styles.contributionRow}>
                            <Text style={styles.contributionAmount}>
                              {formatCurrency(contribution.amount)}
                            </Text>
                            <Text style={[
                              styles.contributionStatus,
                              { color: contribution.status === 'CONFIRMED' ? '#10B981' : 
                                        contribution.status === 'PENDING' ? '#F59E0B' : '#EF4444' }
                            ]}>
                              {contribution.status}
                            </Text>
                          </View>
                          <View style={styles.contributionRow}>
                            <Text style={styles.contributionMethod}>
                              {contribution.method.toUpperCase()}
                            </Text>
                            <Text style={styles.contributionDate}>
                              {formatDate(contribution.created_at)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })()}

                {isCurrent && (
                  <View style={styles.currentIndicator}>
                    <Text style={styles.currentText}>Current Period</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  scrollHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  scheduleContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingRight: 32, // Extra padding for better scrolling
  },
  periodCard: {
    width: 200,
    minWidth: 180, // Reduced minimum width for smaller screens
    maxWidth: 220, // Maximum width for larger screens
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 8, // Additional spacing between cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentPeriodCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  overduePeriodCard: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dueDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  amountContainer: {
    marginBottom: 12,
  },
  expectedAmount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  paidAmount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 4,
  },
  remainingAmount: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  contributionsList: {
    marginTop: 8,
  },
  contributionItem: {
    flexDirection: 'column', // Changed to column for better mobile display
    paddingVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 8,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    padding: 8,
  },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  contributionAmount: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  contributionMethod: {
    fontSize: 10,
    color: '#6B7280',
  },
  contributionStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  contributionDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  currentIndicator: {
    backgroundColor: '#3B82F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  currentText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});