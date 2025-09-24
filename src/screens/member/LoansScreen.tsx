import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLoanStore } from '../../stores/loanStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import LoanCalculator from '../../components/LoanCalculator';

export default function LoansScreen() {
  const { session } = useAuth();
  const { currentGroup, currentCircle, groupSettings } = useGroupStore();
  const {
    memberLoans,
    loanPayments,
    isLoading,
    error,
    loadMemberLoans,
    loadLoanPayments,
    refreshData,
  } = useLoanStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentGroup && currentCircle && session?.user?.id) {
      loadMemberLoans(currentGroup.id, currentCircle.id, session.user.id);
    }
  }, [currentGroup, currentCircle, session?.user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

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

  if (isLoading && !memberLoans[session?.user?.id || '']) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading loans...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentGroup || !currentCircle) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No group or circle data available</Text>
      </View>
    );
  }

  const userLoans = memberLoans[session?.user?.id || ''] || [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Loans</Text>
        <Text style={styles.subtitle}>
          {currentGroup.name} - {currentCircle.year}
        </Text>
      </View>

      {userLoans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyTitle}>No Loans Yet</Text>
          <Text style={styles.emptyText}>
            You haven't requested any loans yet. Tap the "Request Loan" tab to get started.
          </Text>
        </View>
      ) : (
        <View style={styles.loansList}>
          {userLoans.map((loan) => (
            <View key={loan.id} style={styles.loanCard}>
              <View style={styles.loanHeader}>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanAmount}>
                    {formatCurrency(loan.principal)}
                  </Text>
                  <Text style={styles.loanPurpose}>{loan.purpose}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) }]}>
                  <Text style={styles.statusText}>
                    {getStatusText(loan.status)}
                  </Text>
                </View>
              </View>
              
              <LoanCalculator 
                loan={loan} 
                payments={loanPayments[loan.id] || []}
                showDetails={true}
                groupSettings={groupSettings}
              />
            </View>
          ))}
        </View>
      )}

      {/* Loans Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Loans Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{userLoans.length}</Text>
            <Text style={styles.summaryLabel}>Total Loans</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {userLoans.filter(l => l.status === 'ACTIVE').length}
            </Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {userLoans.filter(l => l.status === 'COMPLETED').length}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {formatCurrency(userLoans.reduce((sum, l) => sum + l.principal, 0))}
            </Text>
            <Text style={styles.summaryLabel}>Total Amount</Text>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  loansList: {
    padding: 16,
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanInfo: {
    flex: 1,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  loanPurpose: {
    fontSize: 14,
    color: '#6B7280',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryContainer: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#EF4444',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
});
