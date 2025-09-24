import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Switch,
  Image,
  Pressable,
  FlatList,
  SectionList,
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { useContributionStore } from '../../stores/contributionStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import { Contribution, UserRole } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { canAccessTreasurerFunctions } from '../../utils/rolePermissions';
import ContributionSchedule from '../../components/ContributionSchedule';
import ContributionSummary from '../../components/ContributionSummary';

export default function ContributionsScreen() {
  const { currentGroup, currentCircle, groupSettings, members } = useGroupStore();
  const { profile } = useAuth();
  const {
    contributions,
    plannedInstallments,
    memberContributions,
    isLoading,
    error,
    loadContributions,
    loadMemberContributions,
    makeContribution,
    confirmContribution,
    rejectContribution,
    generatePlannedInstallments,
    refreshData,
  } = useContributionStore();

  const userRole = profile?.role as UserRole || 'MEMBER';
  const canConfirmContributions = canAccessTreasurerFunctions(userRole);
  const canAddContributions = userRole === 'TREASURER';

  const [refreshing, setRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contributionData, setContributionData] = useState({
    memberId: '',
    periodIndex: 0,
    amount: '',
    method: 'cash',
    note: '',
  });

  useEffect(() => {
    if (currentGroup && currentCircle && groupSettings) {
      loadContributions(currentGroup.id, currentCircle.id);
      // Generate planned installments
      const installments = generatePlannedInstallments(groupSettings, currentCircle);
    }
  }, [currentGroup, currentCircle, groupSettings]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentGroup && currentCircle && groupSettings) {
      await loadContributions(currentGroup.id, currentCircle.id);
      generatePlannedInstallments(groupSettings, currentCircle);
    }
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredContributions = contributions.filter(contribution => {
    const member = members.find(m => m.id === contribution.member_id);
    const memberName = member?.full_name || 'Unknown';
    return memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           contribution.method.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddContribution = async () => {
    if (!currentGroup || !currentCircle || !groupSettings) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    if (!contributionData.memberId || !contributionData.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const success = await makeContribution({
      group_id: currentGroup.id,
      circle_id: currentCircle.id,
      member_id: contributionData.memberId,
      period_index: contributionData.periodIndex,
      planned_installments: plannedInstallments.length,
      amount: Number(contributionData.amount),
      method: contributionData.method as 'cash' | 'bank_transfer' | 'mobile_money',
      note: contributionData.note,
      attachment_url: undefined,
      contribution_amount_snapshot: Number(contributionData.amount),
      status: 'PENDING',
      created_by: contributionData.memberId, // Will be updated by RPC
    });

    if (success) {
      Alert.alert('Success', 'Contribution recorded successfully');
      setShowAddModal(false);
      setContributionData({ memberId: '', periodIndex: 0, amount: '', method: 'cash', note: '' });
      onRefresh();
    } else {
      Alert.alert('Error', 'Failed to record contribution');
    }
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
            const success = await rejectContribution(contributionId, reason.trim());
            if (success) {
              Alert.alert('Success', 'Contribution rejected');
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

  const getMemberContributions = (memberId: string) => {
    return memberContributions[memberId] || [];
  };

  const getMemberArrears = (memberId: string) => {
    const expectedAmount = groupSettings?.contribution_amount_default || 0;
    const arrearsData = useContributionStore.getState().getMemberArrears(memberId, expectedAmount);
    return arrearsData.totalAmount;
  };

  if (isLoading && contributions.length === 0) {
    return (
      <View style={styles.container}>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contributions List</Text>
        {canAddContributions && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>


      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contributions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{contributions.length}</Text>
          <Text style={styles.statLabel}>Total Payments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {formatCurrency(contributions.filter(c => c.status === 'CONFIRMED').reduce((sum, c) => sum + c.amount, 0))}
          </Text>
          <Text style={styles.statLabel}>Total Amount (Confirmed)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{members.length}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
      </View>

      {/* Pending Contributions for Approval */}
      {contributions.filter(c => c.status === 'PENDING').length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingSectionTitle}>Pending Approvals ({contributions.filter(c => c.status === 'PENDING').length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {contributions.filter(c => c.status === 'PENDING').map((contribution) => (
              <View key={contribution.id} style={styles.pendingCard}>
                <Text style={styles.pendingMemberName}>
                  {members.find(m => m.id === contribution.member_id)?.full_name || 'Unknown Member'}
                </Text>
                <Text style={styles.pendingAmount}>{formatCurrency(contribution.amount)}</Text>
                <Text style={styles.pendingMethod}>{contribution.method}</Text>
                <Text style={styles.pendingDate}>{formatDate(contribution.created_at)}</Text>
                {contribution.note && (
                  <Text style={styles.pendingNote}>{contribution.note}</Text>
                )}
                <View style={styles.pendingActions}>
                  <Text style={styles.pendingStatusText}>
                    Status: {contribution.status}
                  </Text>
                  {contribution.status === 'PENDING' && (
                    <Text style={styles.pendingNoteText}>
                      Go to "Confirm Contributions" tab to approve
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

        {/* Member List */}
        <View style={styles.membersList}>
          {members.map((member) => {
            const memberContribs = getMemberContributions(member.id);
            const arrears = getMemberArrears(member.id);
            const totalPaid = memberContribs.filter(c => c.status === 'CONFIRMED').reduce((sum, c) => sum + c.amount, 0);
            
            return (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
              >
                <View style={styles.memberHeader}>
                  <View>
                    <Text style={styles.memberName}>{member.full_name}</Text>
                    <Text style={styles.memberPhone}>{member.phone}</Text>
                  </View>
                  <View style={styles.memberStats}>
                    <Text style={styles.memberTotal}>{formatCurrency(totalPaid)}</Text>
                    <Text style={styles.memberArrears}>
                      {arrears > 0 ? `Arrears: ${formatCurrency(arrears)}` : 'Up to date'}
                    </Text>
                  </View>
                </View>
                
                {selectedMember === member.id && (
                  <View style={styles.memberDetails}>
                    <ContributionSummary
                      contributions={memberContribs}
                      expectedAmount={groupSettings.contribution_amount_default}
                      totalPeriods={plannedInstallments.length}
                    />
                    <ContributionSchedule
                      contributions={memberContribs}
                      plannedInstallments={plannedInstallments}
                      expectedAmount={groupSettings.contribution_amount_default}
                      memberId={member.id}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Contribution Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Contribution</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Member *</Text>
              <View style={styles.memberSelector}>
                {members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberOption,
                      contributionData.memberId === member.id && styles.memberOptionActive
                    ]}
                    onPress={() => setContributionData(prev => ({ ...prev, memberId: member.id }))}
                  >
                    <Text style={[
                      styles.memberOptionText,
                      contributionData.memberId === member.id && styles.memberOptionTextActive
                    ]}>
                      {member.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Period *</Text>
              <View style={styles.periodSelector}>
                {plannedInstallments.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.periodButton,
                      contributionData.periodIndex === index && styles.periodButtonActive
                    ]}
                    onPress={() => setContributionData(prev => ({ ...prev, periodIndex: index }))}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      contributionData.periodIndex === index && styles.periodButtonTextActive
                    ]}>
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={contributionData.amount}
                onChangeText={(text) => setContributionData(prev => ({ ...prev, amount: text }))}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.methodButtons}>
                {['cash', 'bank_transfer', 'mobile_money', 'cheque'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodButton,
                      contributionData.method === method && styles.methodButtonActive
                    ]}
                    onPress={() => setContributionData(prev => ({ ...prev, method }))}
                  >
                    <Text style={[
                      styles.methodButtonText,
                      contributionData.method === method && styles.methodButtonTextActive
                    ]}>
                      {method.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={contributionData.note}
                onChangeText={(text) => setContributionData(prev => ({ ...prev, note: text }))}
                placeholder="Add a note about this contribution"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddContribution}>
              <Text style={styles.submitButtonText}>Record Contribution</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  membersList: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom to avoid menu overlap
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memberPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  memberTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  memberArrears: {
    fontSize: 12,
    color: '#6B7280',
  },
  memberDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#3B82F6',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  memberSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  memberOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  memberOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberOptionTextActive: {
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  methodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  methodButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  methodButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  methodButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
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
  // Pending contributions styles
  pendingSection: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  pendingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  pendingMethod: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  pendingDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  pendingNote: {
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  roleIndicator: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
  },
  roleText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingStatusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  pendingNoteText: {
    fontSize: 11,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginTop: 4,
  },
});