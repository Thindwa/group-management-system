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
import { useLoanStore } from '../../stores/loanStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';
import BenefitRequestCard from '../../components/BenefitRequestCard';
import LoanRequestCard from '../../components/LoanRequestCard';
import LoanCalculator from '../../components/LoanCalculator';

export default function ApprovalsScreen() {
  const { session } = useAuth();
  const { currentGroup, currentCircle, groupSettings } = useGroupStore();
  const {
    pendingBenefits,
    reviewBenefit,
    isLoading: benefitsLoading,
    error: benefitsError,
    loadBenefits,
  } = useBenefitStore();
  const {
    pendingLoans,
    reviewLoan,
    isLoading: loansLoading,
    error: loansError,
    loadLoans,
  } = useLoanStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefits' | 'loans'>('benefits');
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);

  useEffect(() => {
    if (currentGroup && currentCircle) {
      loadBenefits(currentGroup.id, currentCircle.id);
      loadLoans(currentGroup.id, currentCircle.id);
    }
  }, [currentGroup, currentCircle]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentGroup && currentCircle) {
      await Promise.all([
        loadBenefits(currentGroup.id, currentCircle.id),
        loadLoans(currentGroup.id, currentCircle.id),
      ]);
    }
    setRefreshing(false);
  };

  const handleReviewBenefit = async (benefitId: string, action: 'approve' | 'reject', note?: string) => {
    console.log('Reviewing benefit:', { benefitId, action, note });
    const success = await reviewBenefit(benefitId, action, note);
    console.log('Benefit review result:', success);
    if (success) {
      Alert.alert('Success', `Benefit ${action}ed successfully.`);
      // Refresh data
      if (currentGroup && currentCircle) {
        await loadBenefits(currentGroup.id, currentCircle.id);
      }
    } else {
      console.error('Benefit review failed:', benefitsError);
      Alert.alert('Error', benefitsError || `Failed to ${action} benefit.`);
    }
  };

  const handleReviewLoan = async (loanId: string, action: 'approve' | 'reject', note?: string) => {
    console.log('Reviewing loan:', { loanId, action, note });
    const success = await reviewLoan(loanId, action, note);
    console.log('Loan review result:', success);
    if (success) {
      Alert.alert('Success', `Loan ${action}ed successfully.`);
      // Refresh data
      if (currentGroup && currentCircle) {
        await loadLoans(currentGroup.id, currentCircle.id);
      }
    } else {
      console.error('Loan review failed:', loansError);
      Alert.alert('Error', loansError || `Failed to ${action} loan.`);
    }
  };

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  if (!currentGroup || !currentCircle) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Please select a group and circle to view approvals.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.header}>Approvals for {currentGroup.name} - {currentCircle.year}</Text>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'benefits' && styles.activeTabButton]}
            onPress={() => setActiveTab('benefits')}
          >
            <Text style={styles.tabButtonText}>Benefits ({pendingBenefits.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'loans' && styles.activeTabButton]}
            onPress={() => setActiveTab('loans')}
          >
            <Text style={styles.tabButtonText}>Loans ({pendingLoans.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits Tab */}
        {activeTab === 'benefits' && (
          <View style={styles.tabContent}>
            {benefitsLoading ? (
              <Text style={styles.loadingText}>Loading benefits...</Text>
            ) : benefitsError ? (
              <Text style={styles.errorText}>Error: {benefitsError}</Text>
            ) : pendingBenefits.length === 0 ? (
              <Text style={styles.emptyText}>No pending benefits to approve.</Text>
            ) : (
              <View style={styles.itemsList}>
                {pendingBenefits.map(benefit => (
                  <BenefitRequestCard
                    key={benefit.id}
                    benefit={benefit}
                    onPress={() => setSelectedBenefit(selectedBenefit === benefit.id ? null : benefit.id)}
                    showActions={selectedBenefit === benefit.id}
                    onApprove={() => handleReviewBenefit(benefit.id, 'approve')}
                    onReject={() => handleReviewBenefit(benefit.id, 'reject')}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <View style={styles.tabContent}>
            {__DEV__ && (
              <Text style={{ fontSize: 10, color: 'red', marginBottom: 10 }}>
                Debug: selectedLoan={selectedLoan}, pendingLoans={pendingLoans.length}
              </Text>
            )}
            {loansLoading ? (
              <Text style={styles.loadingText}>Loading loans...</Text>
            ) : loansError ? (
              <Text style={styles.errorText}>Error: {loansError}</Text>
            ) : pendingLoans.length === 0 ? (
              <Text style={styles.emptyText}>No pending loans to approve.</Text>
            ) : (
              <View style={styles.itemsList}>
                {pendingLoans.map(loan => (
                  <View key={loan.id}>
                    <LoanRequestCard
                      loan={loan}
                      groupSettings={groupSettings}
                      onPress={() => {
                        console.log('Loan card pressed:', loan.id);
                        setSelectedLoan(selectedLoan === loan.id ? null : loan.id);
                      }}
                      showActions={selectedLoan === loan.id}
                      onApprove={() => handleReviewLoan(loan.id, 'approve')}
                      onReject={() => handleReviewLoan(loan.id, 'reject')}
                    />
                    {selectedLoan === loan.id && (
                      <View style={styles.detailContainer}>
                        <LoanCalculator loan={loan} groupSettings={groupSettings} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollViewContent: {
    padding: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#007bff',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  tabContent: {
    marginTop: 10,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#dc3545',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  itemsList: {
    marginTop: 10,
  },
  detailContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});