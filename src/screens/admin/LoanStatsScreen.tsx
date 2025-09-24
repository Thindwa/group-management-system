import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLoanStore } from '../../stores/loanStore';
import { useGroupStore } from '../../stores/groupStore';
import LoanDashboard from '../../components/LoanDashboard';
import LoanStatsCard from '../../components/LoanStatsCard';

export default function LoanStatsScreen() {
  const { loans, loadLoans, loanPayments, loadLoanPayments } = useLoanStore();
  const { currentGroup, currentCircle, groupSettings } = useGroupStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  useEffect(() => {
    if (currentGroup && currentCircle) {
      loadData();
    }
  }, [currentGroup, currentCircle]);

  const loadData = async () => {
    if (currentGroup && currentCircle) {
      await loadLoans(currentGroup.id, currentCircle.id);
      
      // Load payments for all loans
      const activeLoans = loans.filter(l => l.status === 'ACTIVE');
      for (const loan of activeLoans) {
        await loadLoanPayments(loan.id);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `MK ${amount.toLocaleString()}`;

  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const closedLoans = loans.filter(l => l.status === 'CLOSED');
  const waitlistedLoans = loans.filter(l => l.status === 'WAITLISTED');

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Loan Statistics & Interest Tracking</Text>
        <Text style={styles.subtitle}>
          Comprehensive loan analysis and interest calculations
        </Text>
      </View>

      {/* Loan Dashboard */}
      <LoanDashboard 
        loans={loans} 
        groupSettings={groupSettings} 
        payments={loanPayments} 
      />

      {/* Individual Loan Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Loan Details</Text>
        <Text style={styles.sectionSubtitle}>
          Click on any loan to view detailed interest calculations
        </Text>
        
        {activeLoans.length > 0 && (
          <View style={styles.loanGroup}>
            <Text style={styles.groupTitle}>Active Loans ({activeLoans.length})</Text>
            {activeLoans.map((loan) => (
              <TouchableOpacity
                key={loan.id}
                style={styles.loanItem}
                onPress={() => setSelectedLoan(selectedLoan?.id === loan.id ? null : loan)}
              >
                <View style={styles.loanHeader}>
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanBorrower}>
                      {loan.borrower?.full_name || 'Unknown Borrower'}
                    </Text>
                    <Text style={styles.loanAmount}>
                      {formatCurrency(loan.principal)}
                    </Text>
                  </View>
                  <Text style={styles.loanStatus}>Active</Text>
                </View>
                
                {selectedLoan?.id === loan.id && (
                  <LoanStatsCard 
                    loan={loan} 
                    groupSettings={groupSettings}
                    payments={loanPayments[loan.id] || []}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {closedLoans.length > 0 && (
          <View style={styles.loanGroup}>
            <Text style={styles.groupTitle}>Closed Loans ({closedLoans.length})</Text>
            {closedLoans.map((loan) => (
              <TouchableOpacity
                key={loan.id}
                style={styles.loanItem}
                onPress={() => setSelectedLoan(selectedLoan?.id === loan.id ? null : loan)}
              >
                <View style={styles.loanHeader}>
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanBorrower}>
                      {loan.borrower?.full_name || 'Unknown Borrower'}
                    </Text>
                    <Text style={styles.loanAmount}>
                      {formatCurrency(loan.principal)}
                    </Text>
                  </View>
                  <Text style={[styles.loanStatus, styles.closedStatus]}>Closed</Text>
                </View>
                
                {selectedLoan?.id === loan.id && (
                  <LoanStatsCard 
                    loan={loan} 
                    groupSettings={groupSettings}
                    payments={loanPayments[loan.id] || []}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {waitlistedLoans.length > 0 && (
          <View style={styles.loanGroup}>
            <Text style={styles.groupTitle}>Waitlisted Loans ({waitlistedLoans.length})</Text>
            {waitlistedLoans.map((loan) => (
              <TouchableOpacity
                key={loan.id}
                style={styles.loanItem}
                onPress={() => setSelectedLoan(selectedLoan?.id === loan.id ? null : loan)}
              >
                <View style={styles.loanHeader}>
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanBorrower}>
                      {loan.borrower?.full_name || 'Unknown Borrower'}
                    </Text>
                    <Text style={styles.loanAmount}>
                      {formatCurrency(loan.principal)}
                    </Text>
                  </View>
                  <Text style={[styles.loanStatus, styles.waitlistStatus]}>Waitlisted</Text>
                </View>
                
                {selectedLoan?.id === loan.id && (
                  <LoanStatsCard 
                    loan={loan} 
                    groupSettings={groupSettings}
                    payments={loanPayments[loan.id] || []}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loans.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No loans found</Text>
            <Text style={styles.emptySubtext}>
              Loans will appear here once they are requested and processed
            </Text>
          </View>
        )}
      </View>

      {/* Interest Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interest Summary</Text>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            This dashboard shows comprehensive loan statistics including:
          </Text>
          <View style={styles.summaryList}>
            <Text style={styles.summaryItem}>• Automatic interest calculations based on loan terms</Text>
            <Text style={styles.summaryItem}>• Real-time payment tracking and outstanding balances</Text>
            <Text style={styles.summaryItem}>• Grace period and overdue status monitoring</Text>
            <Text style={styles.summaryItem}>• Interest earned vs outstanding analysis</Text>
            <Text style={styles.summaryItem}>• Individual loan breakdown with detailed calculations</Text>
            <Text style={styles.summaryItem}>• Portfolio performance metrics and success rates</Text>
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
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  loanGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  loanItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanInfo: {
    flex: 1,
  },
  loanBorrower: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  loanAmount: {
    fontSize: 14,
    color: '#6B7280',
  },
  loanStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closedStatus: {
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  waitlistStatus: {
    color: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  summaryList: {
    paddingLeft: 16,
  },
  summaryItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
});
