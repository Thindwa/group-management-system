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
} from 'react-native';
import { useContributionStore } from '../../stores/contributionStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import { Contribution } from '../../types';
import { computePlannedInstallments, currentPeriodIndex } from '../../services/schedule';

export default function ContributeScreen() {
  const { session } = useAuth();
  const { currentGroup, currentCircle, groupSettings } = useGroupStore();
  const {
    contributions,
    plannedInstallments,
    currentPeriodIndex: currentPeriod,
    memberContributions,
    isLoading,
    error,
    loadContributions,
    loadMemberContributions,
    makeContribution,
    makeFullCircleContribution,
    generatePlannedInstallments,
    getContributionStatus,
    getMemberArrears,
    refreshData,
  } = useContributionStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'single' | 'full'>('single');
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    note: '',
  });

  useEffect(() => {
    if (currentGroup && currentCircle && groupSettings) {
      loadContributions(currentGroup.id, currentCircle.id);
      
      // Generate planned installments
      const installments = generatePlannedInstallments(groupSettings, currentCircle);
      const currentPeriodIdx = currentPeriodIndex(installments);
      
      // Load member contributions
      if (session?.user?.id) {
        loadMemberContributions(currentGroup.id, currentCircle.id, session.user.id);
      }
    }
  }, [currentGroup, currentCircle, groupSettings, session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
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
    });
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

  const handleMakePayment = () => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    if (!session?.user?.id || !currentGroup || !currentCircle) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    if (!paymentData.amount || isNaN(Number(paymentData.amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = Number(paymentData.amount);
    const expectedAmount = groupSettings?.contribution_amount_default || 0;

    if (paymentType === 'single' && amount < expectedAmount) {
      Alert.alert(
        'Warning',
        `Amount is less than expected contribution of ${formatCurrency(expectedAmount)}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => processPayment() }
        ]
      );
      return;
    }

    processPayment();
  };

  const processPayment = async () => {
    if (!session?.user?.id || !currentGroup || !currentCircle || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let success = false;

      if (paymentType === 'single') {
        success = await makeContribution({
          group_id: currentGroup.id,
          circle_id: currentCircle.id,
          member_id: session.user.id,
          period_index: selectedPeriod,
          planned_installments: plannedInstallments.length,
          amount: Number(paymentData.amount),
          method: paymentData.method as 'cash' | 'bank_transfer' | 'mobile_money',
          note: paymentData.note,
          attachment_url: undefined,
          contribution_amount_snapshot: Number(paymentData.amount),
          status: 'PENDING',
          created_by: session.user.id,
        });
      } else {
        success = await makeFullCircleContribution(
          session.user.id,
          Number(paymentData.amount),
          paymentData.method,
          paymentData.note
        );
      }

      if (success) {
        Alert.alert('Success', 'Contribution recorded successfully');
        setShowPaymentModal(false);
        setPaymentData({ amount: '', method: 'cash', note: '' });
        onRefresh();
      } else {
        Alert.alert('Error', 'Failed to record contribution');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberContributions = () => {
    if (!session?.user?.id) return [];
    return memberContributions[session.user.id] || [];
  };

  const getCurrentMemberArrears = () => {
    if (!session?.user?.id) return { periods: [], totalAmount: 0 };
    return getMemberArrears(session.user.id);
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

  const memberContribs = getMemberContributions();
  const arrears = getCurrentMemberArrears();
  const expectedAmountPerPeriod = groupSettings.contribution_amount_default;
  const expectedAmount = expectedAmountPerPeriod * groupSettings.installments_per_circle;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Contributions</Text>
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <Text style={styles.payButtonText}>Make Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Contribution Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Contribution Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Expected Amount:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(expectedAmount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Paid:</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(memberContribs.reduce((sum, c) => sum + c.amount, 0))}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Arrears:</Text>
          <Text style={[styles.summaryValue, { color: arrears.totalAmount > 0 ? '#EF4444' : '#10B981' }]}>
            {formatCurrency(arrears.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Payment Schedule */}
      <View style={styles.scheduleCard}>
        <Text style={styles.scheduleTitle}>Payment Schedule</Text>
        {plannedInstallments.map((installment, index) => {
          const status = getContributionStatus(session?.user?.id || '', index);
          const isOverdue = status === 'overdue';
          const isCurrent = index === currentPeriod;
          
          return (
            <View key={index} style={[
              styles.scheduleItem,
              isCurrent && styles.currentPeriod,
              isOverdue && styles.overduePeriod
            ]}>
              <View style={styles.scheduleItemHeader}>
                <Text style={styles.periodText}>Period {index + 1}</Text>
                <Text style={styles.dueDateText}>{formatDate(installment)}</Text>
              </View>
              <View style={styles.scheduleItemDetails}>
                <Text style={styles.expectedAmountText}>
                  Expected: {formatCurrency(expectedAmount)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                  <Text style={styles.statusText}>{getStatusText(status)}</Text>
                </View>
              </View>
              {memberContribs.filter(c => c.period_index === index).map((contribution, idx) => (
                <View key={idx} style={styles.contributionItem}>
                  <View style={styles.contributionInfo}>
                    <Text style={styles.contributionAmount}>
                      {formatCurrency(contribution.amount)} - {contribution.method}
                    </Text>
                    <Text style={styles.contributionDate}>
                      {formatDate(contribution.created_at)}
                    </Text>
                  </View>
                  <View style={[styles.contributionStatusBadge, { 
                    backgroundColor: contribution.status === 'CONFIRMED' ? '#4CAF50' : 
                                   contribution.status === 'PENDING' ? '#FF9800' : '#F44336'
                  }]}>
                    <Text style={styles.contributionStatusText}>
                      {contribution.status === 'CONFIRMED' ? '✓ Confirmed' :
                       contribution.status === 'PENDING' ? '⏳ Pending' : '✗ Rejected'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Make Payment</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.paymentTypeContainer}>
              <Text style={styles.inputLabel}>Payment Type</Text>
              <View style={styles.paymentTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentTypeButton,
                    paymentType === 'single' && styles.paymentTypeButtonActive
                  ]}
                  onPress={() => setPaymentType('single')}
                >
                  <Text style={[
                    styles.paymentTypeButtonText,
                    paymentType === 'single' && styles.paymentTypeButtonTextActive
                  ]}>
                    Single Period
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentTypeButton,
                    paymentType === 'full' && styles.paymentTypeButtonActive
                  ]}
                  onPress={() => setPaymentType('full')}
                >
                  <Text style={[
                    styles.paymentTypeButtonText,
                    paymentType === 'full' && styles.paymentTypeButtonTextActive
                  ]}>
                    Full Circle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {paymentType === 'single' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Period</Text>
                <View style={styles.periodSelector}>
                  {plannedInstallments.map((_, index) => {
                    const status = getContributionStatus(session?.user?.id || '', index);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.periodButton,
                          selectedPeriod === index && styles.periodButtonActive,
                          status === 'paid' && styles.periodButtonPaid
                        ]}
                        onPress={() => setSelectedPeriod(index)}
                        disabled={status === 'paid'}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          selectedPeriod === index && styles.periodButtonTextActive,
                          status === 'paid' && styles.periodButtonTextPaid
                        ]}>
                          {index + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={paymentData.amount}
                onChangeText={(text) => setPaymentData(prev => ({ ...prev, amount: text }))}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
              {paymentData.amount && (
                <Text style={styles.amountPreview}>
                  {formatCurrency(Number(paymentData.amount))}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.methodButtons}>
                {['cash', 'bank_transfer', 'mobile_money', 'cheque'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodButton,
                      paymentData.method === method && styles.methodButtonActive
                    ]}
                    onPress={() => setPaymentData(prev => ({ ...prev, method }))}
                  >
                    <Text style={[
                      styles.methodButtonText,
                      paymentData.method === method && styles.methodButtonTextActive
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
                value={paymentData.note}
                onChangeText={(text) => setPaymentData(prev => ({ ...prev, note: text }))}
                placeholder="Add a note about this payment"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={handleMakePayment}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  payButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scheduleCard: {
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
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  scheduleItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  currentPeriod: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  overduePeriod: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dueDateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scheduleItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expectedAmountText: {
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
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    marginTop: 4,
  },
  contributionAmount: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  contributionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  contributionInfo: {
    flex: 1,
  },
  contributionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  contributionStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
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
  paymentTypeContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  paymentTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  paymentTypeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  paymentTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentTypeButtonTextActive: {
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
  periodButtonPaid: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  periodButtonTextPaid: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
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
  amountPreview: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
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
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
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
});
