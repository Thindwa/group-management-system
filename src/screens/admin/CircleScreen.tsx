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
  Picker,
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
import { useGroupStore } from '../../stores/groupStore';
import { useContributionStore } from '../../stores/contributionStore';
import { useBenefitStore } from '../../stores/benefitStore';
import { useLoanStore } from '../../stores/loanStore';
import { useLedgerStore } from '../../stores/ledgerStore';
import { supabase } from '../../services/supabase';

export default function CircleScreen() {
  const { 
    currentGroup, 
    currentCircle, 
    groupSettings, 
    members,
    loadGroup,
    loadGroupSettings,
    loadCurrentCircle,
    loadMembers,
    refreshData,
  } = useGroupStore();
  const { contributions } = useContributionStore();
  const { benefits } = useBenefitStore();
  const { loans } = useLoanStore();
  const { entries, balance } = useLedgerStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rolloverData, setRolloverData] = useState({
    newYear: '',
  });
  const [editData, setEditData] = useState({
    year: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (currentGroup) {
      loadGroupData();
    }
  }, [currentGroup]);

  const loadGroupData = async () => {
    if (!currentGroup) return;
    
    await Promise.all([
      loadGroup(currentGroup.id),
      loadGroupSettings(currentGroup.id),
      loadCurrentCircle(currentGroup.id),
      loadMembers(currentGroup.id),
    ]);
  };

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

  const getCircleStatus = () => {
    if (!currentCircle) return 'No Circle';
    
    const now = new Date();
    const startDate = new Date(currentCircle.start_date);
    const endDate = new Date(currentCircle.end_date);
    
    if (now < startDate) return 'Not Started';
    if (now > endDate) return 'Ended';
    return 'Active';
  };

  const getCircleProgress = () => {
    if (!currentCircle) return 0;
    
    const now = new Date();
    const startDate = new Date(currentCircle.start_date);
    const endDate = new Date(currentCircle.end_date);
    
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
  };

  const getCircleSummary = () => {
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalBenefits = benefits.reduce((sum, b) => sum + b.amount, 0);
    const totalLoans = loans.reduce((sum, l) => sum + l.principal, 0);
    const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
    const pendingBenefits = benefits.filter(b => b.status === 'PENDING').length;
    const pendingLoans = loans.filter(l => l.status === 'PENDING').length;

    return {
      totalContributions,
      totalBenefits,
      totalLoans,
      activeLoans,
      pendingBenefits,
      pendingLoans,
      netBalance: (balance?.available || 0) - (balance?.reserve || 0),
    };
  };

  const canRollover = () => {
    if (!currentCircle) return false;
    
    const now = new Date();
    const endDate = new Date(currentCircle.end_date);
    
    // Can rollover if circle has ended or is very close to ending
    return now >= endDate || (endDate.getTime() - now.getTime()) < (24 * 60 * 60 * 1000); // 24 hours
  };

  const handleRollover = async () => {
    if (!currentGroup || !currentCircle) {
      Alert.alert('Error', 'No group or circle data available');
      return;
    }

    if (!rolloverData.newYear.trim()) {
      Alert.alert('Error', 'Please enter the new circle year');
      return;
    }

    const newYear = rolloverData.newYear.trim();
    
    // Validate year format
    if (!/^\d{4}$/.test(newYear)) {
      Alert.alert('Error', 'Please enter a valid year (e.g., 2024)');
      return;
    }

    Alert.alert(
      'Confirm Circle Rollover',
      `This will close the current circle (${currentCircle.year}) and create a new circle (${newYear}). This action cannot be undone. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => processRollover() }
      ]
    );
  };

  const processRollover = async () => {
    if (!currentGroup || !currentCircle) return;

    setIsProcessing(true);
    try {
      // TODO: Implement actual circle rollover logic
      // This would involve:
      // 1. Closing the current circle
      // 2. Creating a new circle for the next year
      // 3. Updating all related data
      
      Alert.alert(
        'Feature Coming Soon', 
        'Circle rollover functionality will be implemented in a future update. For now, this is a placeholder.'
      );
      
      setShowRolloverModal(false);
      setRolloverData({ newYear: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to complete circle rollover');
      console.error('Rollover error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = () => {
    if (!currentCircle) return;
    
    setEditData({
      year: currentCircle.year.toString(),
      startDate: currentCircle.start_date.split('T')[0], // Convert to YYYY-MM-DD format
      endDate: currentCircle.end_date.split('T')[0],
    });
    setShowEditModal(true);
  };

  const updateCircle = async () => {
    if (!currentCircle) return;

    // Validate required fields
    if (!editData.year.trim() || !editData.startDate.trim() || !editData.endDate.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate year format
    if (!/^\d{4}$/.test(editData.year.trim())) {
      Alert.alert('Error', 'Please enter a valid year (e.g., 2024)');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(editData.startDate) || !dateRegex.test(editData.endDate)) {
      Alert.alert('Error', 'Please enter dates in YYYY-MM-DD format (e.g., 2024-04-01)');
      return;
    }

    // Validate dates
    const startDate = new Date(editData.startDate);
    const endDate = new Date(editData.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      Alert.alert('Error', 'Please enter valid dates');
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('circles')
        .update({
          year: parseInt(editData.year),
          start_date: editData.startDate,
          end_date: editData.endDate,
        })
        .eq('id', currentCircle.id);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Circle updated successfully');
      setShowEditModal(false);
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to update circle');
      console.error('Update error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const summary = getCircleSummary();
  const status = getCircleStatus();
  const progress = getCircleProgress();
  const canRoll = canRollover();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Circle Management</Text>
        <Text style={styles.subtitle}>
          {currentGroup?.name || 'Unknown Group'}
        </Text>
      </View>

      {/* Current Circle Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Current Circle</Text>
        {currentCircle ? (
          <View style={styles.circleCard}>
            <View style={styles.circleHeader}>
              <Text style={styles.circleYear}>{currentCircle.year}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
            </View>
            
            <View style={styles.circleDates}>
              <Text style={styles.dateLabel}>Start Date:</Text>
              <Text style={styles.dateValue}>{formatDate(currentCircle.start_date)}</Text>
            </View>
            <View style={styles.circleDates}>
              <Text style={styles.dateLabel}>End Date:</Text>
              <Text style={styles.dateValue}>{formatDate(currentCircle.end_date)}</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Progress</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${progress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
            </View>
            
            <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
              <Text style={styles.editButtonText}>Edit Circle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noCircleCard}>
            <Text style={styles.noCircleText}>No active circle</Text>
            <Text style={styles.noCircleSubtext}>Create a new circle to get started</Text>
          </View>
        )}
      </View>

      {/* Circle Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Circle Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>💰</Text>
            <Text style={styles.summaryLabel}>Contributions</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalContributions)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🎁</Text>
            <Text style={styles.summaryLabel}>Benefits</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalBenefits)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🏦</Text>
            <Text style={styles.summaryLabel}>Loans</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalLoans)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>👥</Text>
            <Text style={styles.summaryLabel}>Members</Text>
            <Text style={styles.summaryValue}>{members.length}</Text>
          </View>
        </View>
      </View>

      {/* Pending Items */}
      <View style={styles.pendingContainer}>
        <Text style={styles.pendingTitle}>Pending Items</Text>
        <View style={styles.pendingList}>
          <View style={styles.pendingItem}>
            <Text style={styles.pendingLabel}>Active Loans:</Text>
            <Text style={styles.pendingValue}>{summary.activeLoans}</Text>
          </View>
          <View style={styles.pendingItem}>
            <Text style={styles.pendingLabel}>Pending Benefits:</Text>
            <Text style={styles.pendingValue}>{summary.pendingBenefits}</Text>
          </View>
          <View style={styles.pendingItem}>
            <Text style={styles.pendingLabel}>Pending Loans:</Text>
            <Text style={styles.pendingValue}>{summary.pendingLoans}</Text>
          </View>
        </View>
      </View>

      {/* Rollover Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.rolloverButton, !canRoll && styles.rolloverButtonDisabled]}
          onPress={() => setShowRolloverModal(true)}
          disabled={!canRoll}
        >
          <Text style={styles.rolloverButtonText}>
            {canRoll ? 'Rollover to Next Circle' : 'Circle Not Ready for Rollover'}
          </Text>
        </TouchableOpacity>
        
        {!canRoll && (
          <Text style={styles.rolloverNote}>
            Circle must be ended or very close to ending to rollover
          </Text>
        )}
      </View>

      {/* Rollover Modal */}
      <Modal visible={showRolloverModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Circle Rollover</Text>
            <TouchableOpacity onPress={() => setShowRolloverModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ Important</Text>
              <Text style={styles.warningText}>
                This action will close the current circle and create a new one. All pending items will be carried over to the new circle. This action cannot be undone.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Circle Year *</Text>
              <TextInput
                style={styles.input}
                value={rolloverData.newYear}
                onChangeText={(text) => setRolloverData(prev => ({ ...prev, newYear: text }))}
                placeholder="Enter year (e.g., 2024)"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>


            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
              onPress={handleRollover}
              disabled={isProcessing}
            >
              <Text style={styles.submitButtonText}>
                {isProcessing ? 'Processing...' : 'Rollover Circle'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Circle Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Circle</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Year *</Text>
              <TextInput
                style={styles.input}
                value={editData.year}
                onChangeText={(text) => setEditData(prev => ({ ...prev, year: text }))}
                placeholder="2024"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date *</Text>
              <TextInput
                style={styles.input}
                value={editData.startDate}
                onChangeText={(text) => setEditData(prev => ({ ...prev, startDate: text }))}
                placeholder="YYYY-MM-DD"
                keyboardType="default"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date *</Text>
              <TextInput
                style={styles.input}
                value={editData.endDate}
                onChangeText={(text) => setEditData(prev => ({ ...prev, endDate: text }))}
                placeholder="YYYY-MM-DD"
                keyboardType="default"
              />
            </View>


            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
              onPress={updateCircle}
              disabled={isProcessing}
            >
              <Text style={styles.submitButtonText}>
                {isProcessing ? 'Updating...' : 'Update Circle'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  const colors = {
    'No Circle': '#6B7280',
    'Not Started': '#F59E0B',
    'Active': '#10B981',
    'Ended': '#EF4444',
  };
  return colors[status as keyof typeof colors] || '#6B7280';
};

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
  statusContainer: {
    padding: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  circleCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  circleYear: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  circleDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  noCircleCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noCircleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  noCircleSubtext: {
    fontSize: 14,
    color: '#6B7280',
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
  summaryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  pendingContainer: {
    padding: 16,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  pendingList: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pendingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionsContainer: {
    padding: 16,
  },
  rolloverButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rolloverButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  rolloverButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rolloverNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
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
  warningBox: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
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
  submitButton: {
    backgroundColor: '#EF4444',
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
});
