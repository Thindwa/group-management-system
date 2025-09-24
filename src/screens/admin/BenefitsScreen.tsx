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
import { useBenefitStore } from '../../stores/benefitStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import { Benefit, UserRole } from '../../types';
import { canAccessTreasurerFunctions } from '../../utils/rolePermissions';
import { supabase } from '../../services/supabase';
import { useRoute } from '@react-navigation/native';

export default function BenefitsScreen() {
  const route = useRoute();
  const mode = (route.params as any)?.mode || 'treasurer';
  const { session } = useAuth();
  const { currentGroup, currentCircle, groupSettings } = useGroupStore();
  const [userRole, setUserRole] = useState<string | null>(null);
  const canAccessTreasurer = canAccessTreasurerFunctions(userRole as UserRole || 'MEMBER');
  const {
    benefits,
    pendingBenefits,
    approvedBenefits,
    waitlistedBenefits,
    paidBenefits,
    isLoading,
    error,
    loadBenefits,
    reviewBenefit,
    payBenefit,
    promoteWaitlist,
    refreshData,
  } = useBenefitStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'waitlisted' | 'paid'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [reviewData, setReviewData] = useState({
    action: 'approve' as 'approve' | 'reject',
    note: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    note: '',
  });

  useEffect(() => {
    if (currentGroup && currentCircle) {
      loadBenefits(currentGroup.id, currentCircle.id);
    }
  }, [currentGroup, currentCircle]);

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      if (session?.user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          setUserRole(profile?.role || null);
        } catch (error) {
          console.error('Error loading user role:', error);
        }
      }
    };
    loadUserRole();
  }, [session]);

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
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

  const getTypeIcon = (type: string) => {
    const icons = {
      FUNERAL: '🕊️',
      SICKNESS: '🏥',
    };
    return icons[type as keyof typeof icons] || '❓';
  };

  const getCurrentBenefits = () => {
    switch (activeTab) {
      case 'pending':
        return pendingBenefits;
      case 'approved':
        return approvedBenefits;
      case 'waitlisted':
        return waitlistedBenefits;
      case 'paid':
        return paidBenefits;
      default:
        return [];
    }
  };

  const filteredBenefits = getCurrentBenefits().filter(benefit => {
    const memberName = (benefit as any).member?.full_name || 'Unknown';
    return memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           benefit.type.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleReviewBenefit = async () => {
    if (!selectedBenefit) return;

    const success = await reviewBenefit(
      selectedBenefit.id,
      reviewData.action,
      reviewData.note
    );

    if (success) {
      Alert.alert('Success', `Benefit ${reviewData.action}d successfully`);
      setShowReviewModal(false);
      setSelectedBenefit(null);
      setReviewData({ action: 'approve', note: '' });
      onRefresh();
    } else {
      Alert.alert('Error', `Failed to ${reviewData.action} benefit`);
    }
  };

  const handlePayBenefit = async () => {
    if (!selectedBenefit || !paymentData.amount || isSubmitting) return;

    setIsSubmitting(true);
    const success = await payBenefit(
      selectedBenefit.id,
      Number(paymentData.amount),
      paymentData.method,
      paymentData.note
    );

    if (success) {
      Alert.alert('Success', 'Benefit payment recorded successfully');
      setShowPaymentModal(false);
      setSelectedBenefit(null);
      setPaymentData({ amount: '', method: 'cash', note: '' });
      onRefresh();
    } else {
      Alert.alert('Error', 'Failed to record benefit payment');
    }
    setIsSubmitting(false);
  };

  const handlePromoteWaitlist = async () => {
    const success = await promoteWaitlist();
    if (success) {
      Alert.alert('Success', 'Waitlist promotion completed');
      onRefresh();
    } else {
      Alert.alert('Error', 'Failed to promote waitlist items');
    }
  };

  if (isLoading && benefits.length === 0) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Benefits</Text>
        <TouchableOpacity
          style={styles.promoteButton}
          onPress={handlePromoteWaitlist}
        >
          <Text style={styles.promoteButtonText}>Promote Waitlist</Text>
        </TouchableOpacity>
      </View>

      {/* Role Indicator */}
      {mode === 'treasurer' && canAccessTreasurer && (
        <View style={styles.roleIndicator}>
          <Text style={styles.roleText}>
            💰 Treasurer Mode - You can pay benefits and manage payments
          </Text>
        </View>
      )}
      {mode === 'admin' && (
        <View style={styles.roleIndicator}>
          <Text style={styles.roleText}>
            👁️ Admin View - View and manage benefit requests
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingBenefits.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
            Approved ({approvedBenefits.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'waitlisted' && styles.activeTab]}
          onPress={() => setActiveTab('waitlisted')}
        >
          <Text style={[styles.tabText, activeTab === 'waitlisted' && styles.activeTabText]}>
            Waitlisted ({waitlistedBenefits.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'paid' && styles.activeTab]}
          onPress={() => setActiveTab('paid')}
        >
          <Text style={[styles.tabText, activeTab === 'paid' && styles.activeTabText]}>
            Paid ({paidBenefits.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search benefits..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Benefits List */}
      <ScrollView
        style={styles.benefitsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBenefits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No benefits found</Text>
          </View>
        ) : (
          filteredBenefits.map((benefit) => (
            <TouchableOpacity
              key={benefit.id}
              style={styles.benefitCard}
              onPress={() => {
                setSelectedBenefit(benefit);
                if (benefit.status === 'PENDING') {
                  setShowReviewModal(true);
                } else if (benefit.status === 'APPROVED' && mode === 'treasurer' && canAccessTreasurer) {
                  setPaymentData(prev => ({ ...prev, amount: benefit.requested_amount.toString() }));
                  setShowPaymentModal(true);
                } else if (benefit.status === 'APPROVED' && mode === 'treasurer') {
                  Alert.alert('Access Denied', 'Only Treasurer can make payments');
                } else if (benefit.status === 'PAID') {
                  Alert.alert('Benefit Paid', 'This benefit has already been paid');
                } else if (mode === 'admin') {
                  Alert.alert('Benefit Details', `Status: ${benefit.status}\nAmount: MK ${benefit.requested_amount}\nRelative: ${benefit.relative_name}`);
                }
              }}
            >
              <View style={styles.benefitHeader}>
                <View style={styles.benefitTypeContainer}>
                  <Text style={styles.benefitTypeIcon}>
                    {getTypeIcon(benefit.type)}
                  </Text>
                  <View>
                    <Text style={styles.benefitType}>{benefit.type}</Text>
                    <Text style={styles.benefitMember}>
                      {(benefit as any).member?.full_name || 'Unknown'}
                    </Text>
                  </View>
                </View>
                <View style={styles.benefitAmountContainer}>
                  <Text style={styles.benefitAmount}>
                    {formatCurrency(benefit.requested_amount)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(benefit.status) }]}>
                    <Text style={styles.statusText}>
                      {getStatusText(benefit.status)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.benefitDetails}>
                <Text style={styles.benefitReason}>{benefit.relative_name}</Text>
                <Text style={styles.benefitDate}>
                  {formatDate(benefit.created_at)}
                </Text>
                {benefit.waitlist_position && (
                  <Text style={styles.waitlistPosition}>
                    Waitlist Position: #{benefit.waitlist_position}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review Benefit</Text>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedBenefit && (
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitInfoTitle}>Benefit Details</Text>
                <Text style={styles.benefitInfoText}>
                  Type: {selectedBenefit.type}
                </Text>
                <Text style={styles.benefitInfoText}>
                  Amount: {formatCurrency(selectedBenefit.requested_amount)}
                </Text>
                <Text style={styles.benefitInfoText}>
                  Member: {(selectedBenefit as any).member?.full_name || 'Unknown'}
                </Text>
                <Text style={styles.benefitInfoText}>
                  Relative: {selectedBenefit.relative_name}
                </Text>
                {selectedBenefit.relative_type && (
                  <Text style={styles.benefitInfoText}>
                    Type: {selectedBenefit.relative_type}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Action *</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    reviewData.action === 'approve' && styles.actionButtonActive
                  ]}
                  onPress={() => setReviewData(prev => ({ ...prev, action: 'approve' }))}
                >
                  <Text style={[
                    styles.actionButtonText,
                    reviewData.action === 'approve' && styles.actionButtonTextActive
                  ]}>
                    Approve
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    reviewData.action === 'reject' && styles.actionButtonActive
                  ]}
                  onPress={() => setReviewData(prev => ({ ...prev, action: 'reject' }))}
                >
                  <Text style={[
                    styles.actionButtonText,
                    reviewData.action === 'reject' && styles.actionButtonTextActive
                  ]}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reviewData.note}
                onChangeText={(text) => setReviewData(prev => ({ ...prev, note: text }))}
                placeholder="Add a note about your decision"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleReviewBenefit}>
              <Text style={styles.submitButtonText}>
                {reviewData.action === 'approve' ? 'Approve Benefit' : 'Reject Benefit'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pay Benefit</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedBenefit && (
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitInfoTitle}>Benefit Details</Text>
                <Text style={styles.benefitInfoText}>
                  Type: {selectedBenefit.type}
                </Text>
                <Text style={styles.benefitInfoText}>
                  Amount: {formatCurrency(selectedBenefit.requested_amount)}
                </Text>
                <Text style={styles.benefitInfoText}>
                  Member: {(selectedBenefit as any).member?.full_name || 'Unknown'}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={paymentData.amount}
                editable={false}
                placeholder="Enter payment amount"
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
              onPress={handlePayBenefit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Processing...' : 'Record Payment'}
              </Text>
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
  promoteButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  promoteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
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
  benefitsList: {
    flex: 1,
    padding: 16,
  },
  benefitCard: {
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
  benefitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  benefitTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  benefitTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  benefitMember: {
    fontSize: 14,
    color: '#6B7280',
  },
  benefitAmountContainer: {
    alignItems: 'flex-end',
  },
  benefitAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
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
  benefitDetails: {
    gap: 4,
  },
  benefitReason: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  benefitDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  waitlistPosition: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
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
  benefitInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  benefitInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  benefitInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionButtonTextActive: {
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
  amountPreview: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
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
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
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
});

