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
import { useBenefitStore } from '../../stores/benefitStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import { Benefit } from '../../types';

export default function RequestBenefitScreen() {
  const { session } = useAuth();
  const { currentGroup, currentCircle, groupSettings } = useGroupStore();
  const { requestBenefit, isLoading, error } = useBenefitStore();
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [benefitData, setBenefitData] = useState({
    type: 'FUNERAL' as 'FUNERAL' | 'SICKNESS',
    amount: groupSettings?.funeral_benefit?.toString() || '',
    reason: '',
    description: '',
    attachment_url: '',
  });

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  const getBenefitTypeInfo = (type: string) => {
    const info = {
      FUNERAL: {
        label: 'Funeral Benefit',
        icon: '🕊️',
        description: 'Financial assistance for funeral expenses',
        maxAmount: groupSettings?.funeral_benefit || 0,
      },
      SICKNESS: {
        label: 'Sickness Benefit',
        icon: '🏥',
        description: 'Financial assistance for medical expenses',
        maxAmount: groupSettings?.sickness_benefit || 0,
      },
    };
    return info[type as keyof typeof info] || info.FUNERAL;
  };

  const handleBenefitTypeChange = (type: 'FUNERAL' | 'SICKNESS') => {
    const typeInfo = getBenefitTypeInfo(type);
    setBenefitData(prev => ({ 
      ...prev, 
      type,
      amount: typeInfo.maxAmount.toString()
    }));
  };

  // Update amount when groupSettings change
  useEffect(() => {
    if (groupSettings && benefitData.amount === '') {
      const typeInfo = getBenefitTypeInfo(benefitData.type);
      setBenefitData(prev => ({ 
        ...prev, 
        amount: typeInfo.maxAmount.toString()
      }));
    }
  }, [groupSettings]);

  const handleRequestBenefit = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    if (!session?.user?.id || !currentGroup || !currentCircle || !groupSettings) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    if (!benefitData.amount || isNaN(Number(benefitData.amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!benefitData.reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the benefit request');
      return;
    }

    // Amount is always set to maximum, so no validation needed
    processRequest();
  };

  const processRequest = async () => {
    if (!session?.user?.id || !currentGroup || !currentCircle || !groupSettings || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await requestBenefit({
        group_id: currentGroup.id,
        circle_id: currentCircle.id,
        member_id: session.user.id,
        type: benefitData.type,
        relative_type: benefitData.reason.trim(),
        relative_name: benefitData.description.trim(),
        requested_amount: Number(benefitData.amount),
        status: 'PENDING',
        requested_at: new Date().toISOString(),
      });

      if (success) {
        Alert.alert('Success', 'Benefit request submitted successfully');
        setShowRequestModal(false);
        setBenefitData({
          type: 'FUNERAL',
          amount: groupSettings?.funeral_benefit?.toString() || '',
          reason: '',
          description: '',
          attachment_url: '',
        });
      } else {
        Alert.alert('Error', 'Failed to submit benefit request');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
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

  const funeralMax = groupSettings.funeral_benefit || 0;
  const sicknessMax = groupSettings.sickness_benefit || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Request Benefit</Text>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => setShowRequestModal(true)}
        >
          <Text style={styles.requestButtonText}>+ New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Benefit Types Overview */}
      <View style={styles.overviewContainer}>
        <Text style={styles.overviewTitle}>Available Benefits</Text>
        
        <View style={styles.benefitTypeCard}>
          <Text style={styles.benefitTypeIcon}>🕊️</Text>
          <View style={styles.benefitTypeInfo}>
            <Text style={styles.benefitTypeLabel}>Funeral Benefit</Text>
            <Text style={styles.benefitTypeDescription}>
              Financial assistance for funeral expenses
            </Text>
            <Text style={styles.benefitTypeAmount}>
              Max: {formatCurrency(funeralMax)}
            </Text>
          </View>
        </View>

        <View style={styles.benefitTypeCard}>
          <Text style={styles.benefitTypeIcon}>🏥</Text>
          <View style={styles.benefitTypeInfo}>
            <Text style={styles.benefitTypeLabel}>Sickness Benefit</Text>
            <Text style={styles.benefitTypeDescription}>
              Financial assistance for medical expenses
            </Text>
            <Text style={styles.benefitTypeAmount}>
              Max: {formatCurrency(sicknessMax)}
            </Text>
          </View>
        </View>
      </View>

      {/* Request Modal */}
      <Modal visible={showRequestModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Benefit</Text>
            <TouchableOpacity onPress={() => setShowRequestModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Benefit Type *</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    benefitData.type === 'FUNERAL' && styles.typeButtonActive
                  ]}
                  onPress={() => handleBenefitTypeChange('FUNERAL')}
                >
                  <Text style={styles.typeButtonIcon}>🕊️</Text>
                  <Text style={[
                    styles.typeButtonText,
                    benefitData.type === 'FUNERAL' && styles.typeButtonTextActive
                  ]}>
                    Funeral
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    benefitData.type === 'SICKNESS' && styles.typeButtonActive
                  ]}
                  onPress={() => handleBenefitTypeChange('SICKNESS')}
                >
                  <Text style={styles.typeButtonIcon}>🏥</Text>
                  <Text style={[
                    styles.typeButtonText,
                    benefitData.type === 'SICKNESS' && styles.typeButtonTextActive
                  ]}>
                    Sickness
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={benefitData.amount}
                editable={false}
                placeholder="Amount will be set automatically"
                keyboardType="numeric"
              />
              {benefitData.amount && (
                <Text style={styles.amountPreview}>
                  {formatCurrency(Number(benefitData.amount))}
                </Text>
              )}
              <Text style={styles.amountHint}>
                💡 Amount is automatically set to maximum for {benefitData.type === 'FUNERAL' ? 'funeral' : 'sickness'} benefit.
              </Text>
              <Text style={styles.amountLimit}>
                Maximum: {formatCurrency(getBenefitTypeInfo(benefitData.type).maxAmount)}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={benefitData.reason}
                onChangeText={(text) => setBenefitData(prev => ({ ...prev, reason: text }))}
                placeholder="Brief reason for the benefit request"
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={benefitData.description}
                onChangeText={(text) => setBenefitData(prev => ({ ...prev, description: text }))}
                placeholder="Additional details about the request"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Attachment URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={benefitData.attachment_url}
                onChangeText={(text) => setBenefitData(prev => ({ ...prev, attachment_url: text }))}
                placeholder="Link to supporting documents"
                keyboardType="url"
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Important</Text>
              <Text style={styles.infoText}>
                • Benefit requests require approval from group administrators{'\n'}
                • You may be placed on a waitlist if funds are insufficient{'\n'}
                • Provide accurate information to avoid delays{'\n'}
                • Supporting documents help with faster approval
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleRequestBenefit}
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
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  overviewContainer: {
    padding: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  benefitTypeCard: {
    flexDirection: 'row',
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
  benefitTypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  benefitTypeInfo: {
    flex: 1,
  },
  benefitTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  benefitTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  benefitTypeAmount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
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
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    color: '#6B7280',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  amountPreview: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountHint: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountLimit: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
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
