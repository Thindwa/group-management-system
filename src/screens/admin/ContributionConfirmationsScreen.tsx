import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useContributionStore } from '../../stores/contributionStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import { Contribution, UserRole } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { canAccessTreasurerFunctions } from '../../utils/rolePermissions';

export default function ContributionConfirmationsScreen() {
  const { currentGroup, currentCircle, groupSettings, members } = useGroupStore();
  const { profile } = useAuth();
  const {
    contributions,
    isLoading,
    error,
    loadContributions,
    confirmContribution,
    rejectContribution,
    refreshData,
  } = useContributionStore();

  const userRole = profile?.role as UserRole || 'MEMBER';
  const canConfirmContributions = canAccessTreasurerFunctions(userRole);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentGroup && currentCircle) {
      loadContributions(currentGroup.id, currentCircle.id);
    }
  }, [currentGroup, currentCircle]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleConfirmContribution = async (contributionId: string) => {
    Alert.alert(
      'Confirm Contribution',
      'Are you sure you want to confirm this contribution? This will add the money to the group balance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const success = await confirmContribution(contributionId);
            if (success) {
              Alert.alert('Success', 'Contribution confirmed successfully');
              onRefresh();
            } else {
              Alert.alert('Error', 'Failed to confirm contribution');
            }
          }
        }
      ]
    );
  };

  const handleRejectContribution = async (contributionId: string) => {
    Alert.prompt(
      'Reject Contribution',
      'Please provide a reason for rejecting this contribution:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason) => {
            if (!reason?.trim()) {
              Alert.alert('Error', 'Please provide a reason for rejection');
              return;
            }
            const success = await rejectContribution(contributionId, reason);
            if (success) {
              Alert.alert('Success', 'Contribution rejected successfully');
              onRefresh();
            } else {
              Alert.alert('Error', 'Failed to reject contribution');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  if (!canConfirmContributions) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedText}>
            Access Denied
          </Text>
          <Text style={styles.accessDeniedSubtext}>
            Only Treasurers, Admins, and Superadmins can confirm contributions.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading && contributions.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading contributions...</Text>
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

  if (!currentGroup || !currentCircle || !groupSettings) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No group or circle data available</Text>
      </View>
    );
  }

  const pendingContributions = contributions.filter(c => c.status === 'PENDING');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Contributions</Text>
        <Text style={styles.subtitle}>
          {pendingContributions.length} pending confirmation
        </Text>
      </View>

      {/* Role Indicator */}
      <View style={styles.roleIndicator}>
        <Text style={styles.roleText}>
          🔧 Treasurer Mode - Review and confirm member contributions
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingContributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending contributions</Text>
            <Text style={styles.emptySubtext}>
              All contributions have been processed
            </Text>
          </View>
        ) : (
          <View style={styles.pendingContainer}>
            <Text style={styles.sectionTitle}>Pending Contributions</Text>
            {pendingContributions.map((contribution) => (
              <View key={contribution.id} style={styles.contributionCard}>
                <View style={styles.contributionHeader}>
                  <Text style={styles.memberName}>
                    {members.find(m => m.id === contribution.member_id)?.full_name || 'Unknown Member'}
                  </Text>
                  <Text style={styles.amount}>{formatCurrency(contribution.amount)}</Text>
                </View>
                
                <View style={styles.contributionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Method:</Text>
                    <Text style={styles.detailValue}>{contribution.method}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(contribution.created_at)}</Text>
                  </View>
                  {contribution.note && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Note:</Text>
                      <Text style={styles.detailValue}>{contribution.note}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleConfirmContribution(contribution.id)}
                  >
                    <Text style={styles.confirmButtonText}>✓ Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectContribution(contribution.id)}
                  >
                    <Text style={styles.rejectButtonText}>✗ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
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
  roleIndicator: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 4,
  },
  roleText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  pendingContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  contributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  contributionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
