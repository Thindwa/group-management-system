import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useLoanStore } from '../../stores/loanStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import { Loan } from '../../types';

export default function RequestLoanScreen() {
  const { session } = useAuth();
  const { currentGroup, currentCircle, groupSettings, balance, loadBalance } = useGroupStore();
  const { requestLoan, isLoading, error } = useLoanStore();
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loanData, setLoanData] = useState({
    principal: '',
    description: '',
  });

  // Load balance when component mounts
  useEffect(() => {
    if (currentGroup && currentCircle) {
      loadBalance(currentGroup.id, currentCircle.id);
    }
  }, [currentGroup, currentCircle, loadBalance]);

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  const getLoanInfo = () => {
    if (!groupSettings || !balance) return null;
    
    return {
      maxAmount: balance.spendable || 0,
      interestRate: groupSettings.loan_interest_percent || 0,
      loanPeriod: groupSettings.loan_period_days || 0,
      gracePeriod: groupSettings.grace_period_days || 0,
    };
  };

  const calculateLoanDetails = (principal: number) => {
    const info = getLoanInfo();
    if (!info) return null;

    const interestAmount = (principal * info.interestRate) / 100;
    const totalAmount = principal + interestAmount;
    const dailyPayment = totalAmount / info.loanPeriod;

    return {
      principal,
      interestAmount,
      totalAmount,
      dailyPayment,
      interestRate: info.interestRate,
      loanPeriod: info.loanPeriod,
      gracePeriod: info.gracePeriod,
    };
  };

  const handleRequestLoan = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    if (!session?.user?.id || !currentGroup || !currentCircle || !groupSettings) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    if (!loanData.principal || isNaN(Number(loanData.principal))) {
      Alert.alert('Error', 'Please enter a valid loan amount');
      return;
    }

    if (!loanData.description.trim()) {
      Alert.alert('Error', 'Please provide a description for the loan');
      return;
    }

    const principal = Number(loanData.principal);
    const info = getLoanInfo();
    
    if (!info) {
      Alert.alert('Error', 'Group settings not available');
      return;
    }
    
    if (principal > info.maxAmount) {
      Alert.alert(
        'Amount Exceeds Limit',
        `Maximum loan amount is ${formatCurrency(info.maxAmount)}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => processRequest() }
        ]
      );
      return;
    }

    processRequest();
  };

  const processRequest = async () => {
    if (!session?.user?.id || !currentGroup || !currentCircle || !groupSettings || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const loanDataToSubmit = {
        group_id: currentGroup.id,
        circle_id: currentCircle.id,
        borrower_id: session.user.id,
        principal: Number(loanData.principal),
        status: 'WAITLISTED' as const,
        grace_period_days: groupSettings.grace_period_days || 0,
        grace_source: 'DEFAULT' as const,
        notes: loanData.description.trim(),
        waitlisted_at: new Date().toISOString(),
      };

      console.log('Submitting loan request with data:', loanDataToSubmit);
      
      const success = await requestLoan(loanDataToSubmit);

      if (success) {
        Alert.alert('Success', 'Loan request submitted successfully');
        setShowRequestModal(false);
        setLoanData({
          principal: '',
          description: '',
        });
      } else {
        // Get the error from the store after the request
        const { error: storeError } = useLoanStore.getState();
        console.error('Loan request failed:', storeError);
        Alert.alert('Error', `Failed to submit loan request: ${storeError || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Loan request error:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentGroup || !currentCircle || !groupSettings) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No group or circle data available</Text>
      </View>
    );
  }

  const loanInfo = getLoanInfo();
  const loanDetails = loanData.principal ? calculateLoanDetails(Number(loanData.principal)) : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Request Loan</Text>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => setShowRequestModal(true)}
        >
          <Text style={styles.requestButtonText}>+ New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Loan Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Loan Information</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Maximum Amount</Text>
          <Text style={styles.infoValue}>{formatCurrency(loanInfo?.maxAmount || 0)}</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Interest Rate</Text>
          <Text style={styles.infoValue}>{loanInfo?.interestRate || 0}% per loan period</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Loan Period</Text>
          <Text style={styles.infoValue}>{loanInfo?.loanPeriod || 0} days</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Grace Period</Text>
          <Text style={styles.infoValue}>{loanInfo?.gracePeriod || 0} days</Text>
        </View>
      </View>

      {/* Request Modal */}
      <Modal visible={showRequestModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Loan</Text>
            <TouchableOpacity onPress={() => setShowRequestModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Loan Amount *</Text>
              <TextInput
                style={styles.input}
                value={loanData.principal}
                onChangeText={(text) => setLoanData(prev => ({ ...prev, principal: text }))}
                placeholder="Enter loan amount"
                keyboardType="numeric"
              />
              {loanData.principal && (
                <Text style={styles.amountPreview}>
                  {formatCurrency(Number(loanData.principal))}
                </Text>
              )}
              <Text style={styles.amountLimit}>
                Maximum: {formatCurrency(loanInfo?.maxAmount || 0)}
              </Text>
            </View>

            {loanDetails && (
              <View style={styles.calculationContainer}>
                <Text style={styles.calculationTitle}>Loan Calculation</Text>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Principal:</Text>
                  <Text style={styles.calculationValue}>
                    {formatCurrency(loanDetails.principal)}
                  </Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Interest ({loanDetails.interestRate}%):</Text>
                  <Text style={styles.calculationValue}>
                    {formatCurrency(loanDetails.interestAmount)}
                  </Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Total Amount:</Text>
                  <Text style={[styles.calculationValue, styles.totalAmount]}>
                    {formatCurrency(loanDetails.totalAmount)}
                  </Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Daily Payment:</Text>
                  <Text style={styles.calculationValue}>
                    {formatCurrency(loanDetails.dailyPayment)}
                  </Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Grace Period:</Text>
                  <Text style={styles.calculationValue}>
                    {loanDetails.gracePeriod} days
                  </Text>
                </View>
              </View>
            )}


            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={loanData.description}
                onChangeText={(text) => setLoanData(prev => ({ ...prev, description: text }))}
                placeholder="Purpose and details for the loan request"
                multiline
                numberOfLines={3}
              />
            </View>


            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Important</Text>
              <Text style={styles.infoText}>
                • Loan requests require approval from group administrators{'\n'}
                • You may be placed on a waitlist if funds are insufficient{'\n'}
                • Interest will be calculated on the full loan amount{'\n'}
                • Grace period allows you to start payments after disbursement{'\n'}
                • Provide accurate information to avoid delays
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleRequestLoan}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
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
  requestButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
  amountPreview: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountLimit: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  calculationContainer: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#059669',
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
});
