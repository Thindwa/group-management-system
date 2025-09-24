import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGroupStore } from '../../stores/groupStore';
import { useContributionStore } from '../../stores/contributionStore';
import { useAuth, signOut } from '../../hooks/useAuth';
import BalanceBanner from '../../components/BalanceBanner';
import { supabase } from '../../services/supabase';
import { UserRole } from '../../types';
import { formatCurrency } from '../../utils/formatting';

// Role-specific quick actions with navigation
const getRoleSpecificActions = (role: UserRole) => {
  switch (role) {
    case 'SUPERADMIN':
    case 'ADMIN':
      return [
        { icon: '👥', text: 'Manage Members', screen: 'Members' },
        { icon: '⚙️', text: 'Group Settings', screen: 'Settings' },
        { icon: '✅', text: 'Pending Approvals', screen: 'Approvals' },
        { icon: '📊', text: 'Reports', screen: 'Reports' },
        { icon: '💰', text: 'Contributions', screen: 'Contributions' },
        { icon: '🎁', text: 'Benefits', screen: 'Benefits' },
        { icon: '🏦', text: 'Loans', screen: 'Loans' },
          { icon: '📈', text: 'Loan Stats', screen: 'LoanStats' },
        { icon: '📋', text: 'Ledger', screen: 'Ledger' }
      ];
    case 'TREASURER':
      return [
        { icon: '💰', text: 'Process Payments', screen: 'Contributions' },
        { icon: '📋', text: 'Manage Ledger', screen: 'Ledger' },
        { icon: '🎁', text: 'Pay Benefits', screen: 'Benefits' },
        { icon: '🏦', text: 'Disburse Loans', screen: 'Loans' },
        { icon: '📊', text: 'Financial Reports', screen: 'Reports' },
        { icon: '📈', text: 'Loan Stats', screen: 'LoanStats' },
        { icon: '💳', text: 'Contributions', screen: 'Contributions' }
      ];
    case 'CHAIRPERSON':
      return [
        { icon: '✅', text: 'Approve Requests', screen: 'Approvals' },
        { icon: '🎁', text: 'Review Benefits', screen: 'Benefits' },
        { icon: '🏦', text: 'Review Loans', screen: 'Loans' },
        { icon: '📈', text: 'Loan Stats', screen: 'LoanStats' },
        { icon: '📊', text: 'Oversight Reports', screen: 'Reports' }
      ];
    case 'AUDITOR':
      return [
        { icon: '📊', text: 'Financial Reports', screen: 'Reports' },
        { icon: '📋', text: 'Audit Ledger', screen: 'Ledger' },
        { icon: '💰', text: 'Contribution Audit', screen: 'Contributions' },
        { icon: '🎁', text: 'Benefit Audit', screen: 'Benefits' },
        { icon: '🏦', text: 'Loan Audit', screen: 'Loans' },
        { icon: '📈', text: 'Loan Stats', screen: 'LoanStats' },
        { icon: '📈', text: 'Analytics', screen: 'Reports' }
      ];
    case 'MEMBER':
    default:
      return [
        { icon: '💰', text: 'Make Contribution', screen: 'Contribute' },
        { icon: '🎁', text: 'Request Benefit', screen: 'RequestBenefit' },
        { icon: '🏦', text: 'Apply for Loan', screen: 'RequestLoan' },
        { icon: '📊', text: 'My Benefits', screen: 'Benefits' },
        { icon: '📈', text: 'Loan Stats', screen: 'LoanStats' },
        { icon: '📋', text: 'My Loans', screen: 'Loans' }
      ];
  }
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { session, profile } = useAuth();
  const {
    currentGroup,
    groupSettings,
    currentCircle,
    members,
    balance,
    isLoading,
    error,
    loadGroup,
    loadGroupSettings,
    loadCurrentCircle,
    loadMembers,
    loadBalance,
    refreshData,
  } = useGroupStore();

  const { getTotalConfirmedAmount, loadContributions } = useContributionStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session?.user?.id && !currentGroup) {
      // Load user's group data only if not already loaded
      loadUserGroupData();
    }
  }, [session?.user?.id]);

  // Load contributions when group and circle are available
  useEffect(() => {
    if (currentGroup && currentCircle) {
      loadContributions(currentGroup.id, currentCircle.id);
    }
  }, [currentGroup, currentCircle]);

  const loadUserGroupData = async () => {
    if (!session?.user?.id) return;

    try {
      // First get user's profile to find their group
      const { data: profile } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.group_id) {
        // Load group data first
        await loadGroup(profile.group_id);
        await loadGroupSettings(profile.group_id);
        await loadCurrentCircle(profile.group_id);
        await loadMembers(profile.group_id);

        // Load balance after circle is loaded
        const { currentCircle } = useGroupStore.getState();
        if (currentCircle) {
          await loadBalance(profile.group_id, currentCircle.id);
        }
      }
    } catch (error) {
      console.error('Error loading user group data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  const handleQuickAction = (action: { icon: string; text: string; screen: string }) => {
    try {
      // Navigate to the appropriate screen
      (navigation as any).navigate(action.screen);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', `Could not navigate to ${action.text}. This feature may not be available yet.`);
    }
  };

  if (isLoading && !currentGroup) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserGroupData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentGroup) {
    return (
      <View style={styles.container}>
        <View style={styles.noGroupContainer}>
          <Text style={styles.noGroupTitle}>No Group Found</Text>
          <Text style={styles.noGroupText}>
            You're not part of any group yet. Contact an administrator to join a group or create a new group.
          </Text>
          <TouchableOpacity style={styles.createGroupButton}>
            <Text style={styles.createGroupButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Welcome back, {profile?.full_name || 'User'}
          </Text>
          <Text style={styles.roleText}>
            Role: {profile?.role || 'MEMBER'}
          </Text>
          {currentGroup && (
            <Text style={styles.groupName}>{currentGroup.name}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Banner */}
      <BalanceBanner balance={balance} isLoading={isLoading} />

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{members.length}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {groupSettings?.contribution_amount_default ? formatCurrency(groupSettings.contribution_amount_default) : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Contribution</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {groupSettings?.installments_per_circle || 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Installments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {formatCurrency(getTotalConfirmedAmount())}
          </Text>
          <Text style={styles.statLabel}>Total Confirmed</Text>
        </View>
      </View>

      {/* Circle Information */}
      {currentCircle && (
        <View style={styles.circleCard}>
          <Text style={styles.circleTitle}>Current Circle</Text>
          <Text style={styles.circleYear}>Year {currentCircle.year}</Text>
          <Text style={styles.circleDates}>
            {new Date(currentCircle.start_date).toLocaleDateString()} - {new Date(currentCircle.end_date).toLocaleDateString()}
          </Text>
          <View style={styles.circleStatus}>
            <Text style={styles.circleStatusText}>{currentCircle.status}</Text>
          </View>
        </View>
      )}

      {/* Role-specific Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {getRoleSpecificActions(profile?.role as UserRole).map((action, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.actionButton}
              onPress={() => handleQuickAction(action)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <Text style={styles.noActivityText}>No recent activity</Text>
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
  scrollContent: {
    paddingBottom: 100, // Extra padding to avoid bottom menu overlap
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 24,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  circleCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  circleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  circleYear: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  circleDates: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  circleStatus: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  circleStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionsContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '47%',
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  activityList: {
    minHeight: 100,
    justifyContent: 'center',
  },
  noActivityText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  noGroupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noGroupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  noGroupText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createGroupButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createGroupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});