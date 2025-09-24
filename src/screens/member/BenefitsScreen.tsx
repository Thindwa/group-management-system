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
import { useBenefitStore } from '../../stores/benefitStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import BenefitRequestCard from '../../components/BenefitRequestCard';

export default function BenefitsScreen() {
  const { session } = useAuth();
  const { currentGroup, currentCircle } = useGroupStore();
  const {
    memberBenefits,
    isLoading,
    error,
    loadMemberBenefits,
    refreshData,
  } = useBenefitStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentGroup && currentCircle && session?.user?.id) {
      loadMemberBenefits(currentGroup.id, currentCircle.id, session.user.id);
    }
  }, [currentGroup, currentCircle, session?.user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) {
      return 'MK 0';
    }
    return `MK ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: '#F59E0B',
      APPROVED: '#10B981',
      REJECTED: '#EF4444',
      WAITLISTED: '#6B7280',
      PAID: '#3B82F6',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const getStatusText = (status: string) => {
    const texts = {
      PENDING: 'Pending Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      WAITLISTED: 'Waitlisted',
      PAID: 'Paid',
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (isLoading && !memberBenefits[session?.user?.id || '']) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading benefits...</Text>
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

  const userBenefits = memberBenefits[session?.user?.id || ''] || [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Benefits</Text>
        <Text style={styles.subtitle}>
          {currentGroup.name} - {currentCircle.year}
        </Text>
      </View>

      {userBenefits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={styles.emptyTitle}>No Benefits Yet</Text>
          <Text style={styles.emptyText}>
            You haven't requested any benefits yet. Tap the "Request Benefit" tab to get started.
          </Text>
        </View>
      ) : (
        <View style={styles.benefitsList}>
          {userBenefits.map((benefit) => (
            <BenefitRequestCard
              key={benefit.id}
              benefit={benefit}
              showActions={false}
            />
          ))}
        </View>
      )}

      {/* Benefits Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Benefits Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{userBenefits.length}</Text>
            <Text style={styles.summaryLabel}>Total Requests</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {userBenefits.filter(b => b.status === 'PAID').length}
            </Text>
            <Text style={styles.summaryLabel}>Paid</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {userBenefits.filter(b => b.status === 'PENDING').length}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {formatCurrency(userBenefits.reduce((sum, b) => sum + (b.requested_amount || 0), 0))}
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
  benefitsList: {
    padding: 16,
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
