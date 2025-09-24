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
import { useLoanStore } from '../../stores/loanStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import { Loan, UserRole } from '../../types';
import { canAccessTreasurerFunctions } from '../../utils/rolePermissions';
import { supabase } from '../../services/supabase';
import { useRoute } from '@react-navigation/native';

export default function LoansScreen() {
  const route = useRoute();
  const mode = (route.params as any)?.mode || 'treasurer';
  const { session } = useAuth();
  const { currentGroup, currentCircle, groupSettings } = useGroupStore();
  const [userRole, setUserRole] = useState<string | null>(null);
  const canAccessTreasurer = canAccessTreasurerFunctions(userRole as UserRole || 'MEMBER');
  const {
    loans,
    pendingLoans,
    approvedLoans,
    waitlistedLoans,
    activeLoans,
    closedLoans,
    loanPayments,
    isLoading,
    error,
    loadLoans,
    loadLoanPayments,
    reviewLoan,
    disburseLoan,
    repayLoan,
    extendGrace,
    promoteWaitlist,
    calculateLoanTotals,
    refreshData,
  } = useLoanStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'waitlisted' | 'approved' | 'disbursed' | 'closed' | 'all'>('waitlisted');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showGraceModal, setShowGraceModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [reviewData, setReviewData] = useState({
    action: 'approve' as 'approve' | 'reject',
    note: '',
  });
  const [disburseData, setDisburseData] = useState({
    amount: '',
    method: 'cash',
    note: '',
  });
  const [repayData, setRepayData] = useState({
    amount: '',
    method: 'cash',
    note: '',
  });
  const [graceData, setGraceData] = useState({
    days: '',
    reason: '',
  });

  useEffect(() => {
    if (currentGroup && currentCircle) {
      loadLoans(currentGroup.id, currentCircle.id);
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

  // Load loan payments when selected loan changes
  useEffect(() => {
    if (selectedLoan) {
      loadLoanPayments(selectedLoan.id);
    }
  }, [selectedLoan, loadLoanPayments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
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

  const getCurrentLoans = () => {
    switch (activeTab) {
      case 'waitlisted':
        return waitlistedLoans;
      case 'approved':
        return approvedLoans; // ACTIVE but not disbursed
      case 'disbursed':
        return activeLoans.filter(l => l.disbursed_at); // ACTIVE and disbursed
      case 'closed':
        return closedLoans; // CLOSED loans
      case 'all':
        return activeLoans;
      default:
        return [];
    }
  };

  const filteredLoans = getCurrentLoans().filter(loan => {
    const memberName = loan.borrower?.full_name || 'Unknown';
    return memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           loan.notes?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleReviewLoan = async () => {
    if (!selectedLoan) return;

    const success = await reviewLoan(
      selectedLoan.id,
      reviewData.action,
      reviewData.note
    );

    if (success) {
      Alert.alert('Success', `Loan ${reviewData.action}d successfully`);
      setShowReviewModal(false);
      setSelectedLoan(null);
      setReviewData({ action: 'approve', note: '' });
      onRefresh();
    } else {
      Alert.alert('Error', `Failed to ${reviewData.action} loan`);
    }
  };

  const handleDisburseLoan = async () => {
    if (!selectedLoan || !disburseData.amount || isSubmitting) return;

    setIsSubmitting(true);
    const success = await disburseLoan(
      selectedLoan.id,
      Number(disburseData.amount),
      disburseData.method,
      disburseData.note
    );

    if (success) {
      Alert.alert('Success', 'Loan disbursed successfully');
      setShowDisburseModal(false);
      setSelectedLoan(null);
      setDisburseData({ amount: '', method: 'cash', note: '' });
      onRefresh();
    } else {
      Alert.alert('Error', 'Failed to disburse loan');
    }
    setIsSubmitting(false);
  };

  const handleRepayLoan = async () => {
    if (!selectedLoan || !repayData.amount || isSubmitting) return;

    setIsSubmitting(true);
    const success = await repayLoan(
      selectedLoan.id,
      Number(repayData.amount),
      repayData.method,
      repayData.note
    );

    if (success) {
      Alert.alert('Success', 'Loan repayment recorded successfully');
      setShowRepayModal(false);
      setSelectedLoan(null);
      setRepayData({ amount: '', method: 'cash', note: '' });
      onRefresh();
    } else {
      Alert.alert('Error', 'Failed to record loan repayment');
    }
    setIsSubmitting(false);
  };

  const handleExtendGrace = async () => {
    if (!selectedLoan || !graceData.days) return;

    const success = await extendGrace(
      selectedLoan.id,
      Number(graceData.days),
      graceData.reason
    );

    if (success) {
      Alert.alert('Success', 'Grace period extended successfully');
      setShowGraceModal(false);
      setSelectedLoan(null);
      setGraceData({ days: '', reason: '' });
      onRefresh();
    } else {
      Alert.alert('Error', 'Failed to extend grace period');
    }
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

  if (isLoading && loans.length === 0) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loans</Text>
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
            💰 Treasurer Mode - You can disburse loans and record repayments
          </Text>
        </View>
      )}
      {mode === 'admin' && (
        <View style={styles.roleIndicator}>
          <Text style={styles.roleText}>
            👁️ Admin View - View and manage loan requests
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'waitlisted' && styles.activeTab]}
          onPress={() => setActiveTab('waitlisted')}
        >
          <Text style={[styles.tabText, activeTab === 'waitlisted' && styles.activeTabText]}>
            Waitlisted ({waitlistedLoans.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
            To Disburse ({approvedLoans.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'disbursed' && styles.activeTab]}
          onPress={() => setActiveTab('disbursed')}
        >
          <Text style={[styles.tabText, activeTab === 'disbursed' && styles.activeTabText]}>
            Disbursed ({activeLoans.filter(l => l.disbursed_at).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'closed' && styles.activeTab]}
          onPress={() => setActiveTab('closed')}
        >
          <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>
            Closed ({closedLoans.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Active ({activeLoans.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search loans..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Loans List */}
      <ScrollView
        style={styles.loansList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLoans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No loans found</Text>
          </View>
        ) : (
          filteredLoans.map((loan) => {
            const loanTotals = calculateLoanTotals(loan);
            
            return (
              <TouchableOpacity
                key={loan.id}
                style={styles.loanCard}
                onPress={() => {
                  setSelectedLoan(loan);
                  if (loan.status === 'WAITLISTED') {
                    setShowReviewModal(true);
                  } else if (loan.status === 'ACTIVE' && !loan.disbursed_at && mode === 'treasurer' && canAccessTreasurer) {
                    setDisburseData(prev => ({ ...prev, amount: loan.principal.toString() }));
                    setShowDisburseModal(true);
                  } else if (loan.status === 'ACTIVE' && !loan.disbursed_at && mode === 'treasurer') {
                    Alert.alert('Access Denied', 'Only Treasurer can disburse loans');
                  } else if (loan.status === 'ACTIVE' && loan.disbursed_at && mode === 'treasurer' && canAccessTreasurer) {
                    // Calculate due amount for repayment
                    const loanTotals = calculateLoanTotals(loan, groupSettings || undefined);
                    if (loanTotals && loanTotals.grossDue) {
                      setRepayData(prev => ({ ...prev, amount: loanTotals.grossDue.toString() }));
                    } else {
                      // Fallback to principal amount if calculation fails
                      setRepayData(prev => ({ ...prev, amount: loan.principal.toString() }));
                    }
                    setShowRepayModal(true);
                  } else if (loan.status === 'ACTIVE' && loan.disbursed_at && mode === 'treasurer') {
                    Alert.alert('Access Denied', 'Only Treasurer can record loan repayments');
                  } else if (loan.status === 'CLOSED') {
                    Alert.alert('Loan Closed', 'This loan has been fully repaid and closed');
                  } else if (mode === 'admin') {
                    Alert.alert('Loan Details', `Status: ${loan.status}\nPrincipal: MK ${loan.principal}\nBorrower: ${loan.borrower?.full_name || 'Unknown'}`);
                  }
                }}
              >
                <View style={styles.loanHeader}>
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanAmount}>
                      {formatCurrency(loan.principal)}
                    </Text>
                    <Text style={styles.loanMember}>
                      {loan.borrower?.full_name || 'Unknown'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) }]}>
                    <Text style={styles.statusText}>
                      {getStatusText(loan.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.loanDetails}>
                  <Text style={styles.loanPurpose}>{loan.purpose}</Text>
                  <Text style={styles.loanDate}>
                    {formatDate(loan.created_at)}
                  </Text>
                  {loan.waitlist_position && (
                    <Text style={styles.waitlistPosition}>
                      Waitlist Position: #{loan.waitlist_position}
                    </Text>
                  )}
                  {loanTotals && (
                    <View style={styles.loanTotals}>
                      <Text style={styles.totalLabel}>Total Due:</Text>
                      <Text style={styles.totalAmount}>
                        {formatCurrency(loanTotals.grossDue)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review Loan</Text>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedLoan && (
              <View style={styles.loanInfo}>
                <Text style={styles.loanInfoTitle}>Loan Details</Text>
                <Text style={styles.loanInfoText}>
                  Amount: {formatCurrency(selectedLoan.principal)}
                </Text>
                <Text style={styles.loanInfoText}>
                  Member: {selectedLoan.borrower?.full_name || 'Unknown'}
                </Text>
                <Text style={styles.loanInfoText}>
                  Purpose: {selectedLoan.purpose}
                </Text>
                {selectedLoan.description && (
                  <Text style={styles.loanInfoText}>
                    Description: {selectedLoan.description}
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

            <TouchableOpacity style={styles.submitButton} onPress={handleReviewLoan}>
              <Text style={styles.submitButtonText}>
                {reviewData.action === 'approve' ? 'Approve Loan' : 'Reject Loan'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Disburse Modal */}
      <Modal visible={showDisburseModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Disburse Loan</Text>
            <TouchableOpacity onPress={() => setShowDisburseModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedLoan && (
              <View style={styles.loanInfo}>
                <Text style={styles.loanInfoTitle}>Loan Details</Text>
                <Text style={styles.loanInfoText}>
                  Amount: {formatCurrency(selectedLoan.principal)}
                </Text>
                <Text style={styles.loanInfoText}>
                  Member: {selectedLoan.borrower?.full_name || 'Unknown'}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Disbursement Amount *</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={disburseData.amount}
                editable={false}
                placeholder="Enter disbursement amount"
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
                      disburseData.method === method && styles.methodButtonActive
                    ]}
                    onPress={() => setDisburseData(prev => ({ ...prev, method }))}
                  >
                    <Text style={[
                      styles.methodButtonText,
                      disburseData.method === method && styles.methodButtonTextActive
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
                value={disburseData.note}
                onChangeText={(text) => setDisburseData(prev => ({ ...prev, note: text }))}
                placeholder="Add a note about this disbursement"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={handleDisburseLoan}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Disbursing...' : 'Disburse Loan'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Repay Modal */}
      <Modal visible={showRepayModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Repayment</Text>
            <TouchableOpacity onPress={() => setShowRepayModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedLoan && (
              <View style={styles.loanInfo}>
                <Text style={styles.loanInfoTitle}>Loan Details</Text>
                <Text style={styles.loanInfoText}>
                  Amount: {formatCurrency(selectedLoan.principal)}
                </Text>
                <Text style={styles.loanInfoText}>
                  Member: {selectedLoan.borrower?.full_name || 'Unknown'}
                </Text>
              </View>
            )}

            {/* Payment History */}
            {selectedLoan && loanPayments[selectedLoan.id] && loanPayments[selectedLoan.id].length > 0 && (
              <View style={styles.paymentHistory}>
                <Text style={styles.paymentHistoryTitle}>Payment History</Text>
                {loanPayments[selectedLoan.id].map((payment, index) => (
                  <View key={payment.id || index} style={styles.paymentItem}>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                      <Text style={styles.paymentDate}>
                        {new Date(payment.paid_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text style={styles.paymentMethod}>
                        {payment.method.replace('_', ' ').toUpperCase()}
                      </Text>
                      {payment.note && (
                        <Text style={styles.paymentNote}>{payment.note}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repayment Amount *</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={repayData.amount}
                editable={false}
                placeholder="Enter repayment amount"
                keyboardType="numeric"
              />
              {repayData.amount && (
                <Text style={styles.amountPreview}>
                  {formatCurrency(Number(repayData.amount))}
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
                      repayData.method === method && styles.methodButtonActive
                    ]}
                    onPress={() => setRepayData(prev => ({ ...prev, method }))}
                  >
                    <Text style={[
                      styles.methodButtonText,
                      repayData.method === method && styles.methodButtonTextActive
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
                value={repayData.note}
                onChangeText={(text) => setRepayData(prev => ({ ...prev, note: text }))}
                placeholder="Add a note about this repayment"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={handleRepayLoan}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Recording...' : 'Record Repayment'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Grace Extension Modal */}
      <Modal visible={showGraceModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Extend Grace Period</Text>
            <TouchableOpacity onPress={() => setShowGraceModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedLoan && (
              <View style={styles.loanInfo}>
                <Text style={styles.loanInfoTitle}>Loan Details</Text>
                <Text style={styles.loanInfoText}>
                  Amount: {formatCurrency(selectedLoan.principal)}
                </Text>
                <Text style={styles.loanInfoText}>
                  Member: {selectedLoan.borrower?.full_name || 'Unknown'}
                </Text>
                <Text style={styles.loanInfoText}>
                  Current Grace Period: {selectedLoan.grace_period_days} days
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Days *</Text>
              <TextInput
                style={styles.input}
                value={graceData.days}
                onChangeText={(text) => setGraceData(prev => ({ ...prev, days: text }))}
                placeholder="Enter additional grace days"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={graceData.reason}
                onChangeText={(text) => setGraceData(prev => ({ ...prev, reason: text }))}
                placeholder="Reason for extending grace period"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleExtendGrace}>
              <Text style={styles.submitButtonText}>Extend Grace Period</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
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
  loansList: {
    flex: 1,
    padding: 16,
  },
  loanCard: {
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
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  loanMember: {
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
  loanDetails: {
    gap: 4,
  },
  loanPurpose: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  loanDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  waitlistPosition: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  loanTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
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
  loanInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  loanInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  loanInfoText: {
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
  submitButton: {
    backgroundColor: '#3B82F6',
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
  amountPreview: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  paymentHistory: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  paymentHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  paymentDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  paymentNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
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

