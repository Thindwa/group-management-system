import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLedgerStore } from '../../stores/ledgerStore';
import { useGroupStore } from '../../stores/groupStore';
import { LedgerEntry } from '../../types';
import BalanceBanner from '../../components/BalanceBanner';

export default function LedgerScreen({ navigation }: any) {
  const {
    entries,
    filteredEntries,
    balance,
    isLoading,
    error,
    filters,
    loadLedgerEntries,
    loadBalance,
    updateFilters,
    clearFilters,
    refreshData,
    recalculateBalance,
  } = useLedgerStore();

  const { currentGroup, currentCircle } = useGroupStore();
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentGroup && currentCircle) {
      console.log('🔄 LedgerScreen: Loading data for group:', currentGroup.id, 'circle:', currentCircle.id);
      loadLedgerEntries(currentGroup.id, currentCircle.id);
      loadBalance(currentGroup.id, currentCircle.id);
    }
  }, [currentGroup, currentCircle]);

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
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'CONTRIBUTION_IN': 'Contribution',
      'BENEFIT_OUT': 'Benefit Payment',
      'LOAN_OUT': 'Loan Disbursement',
      'LOAN_REPAYMENT_IN': 'Loan Repayment',
      'ADJUSTMENT': 'Adjustment',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'CONTRIBUTION_IN': '#10B981',
      'BENEFIT_OUT': '#EF4444',
      'LOAN_OUT': '#F59E0B',
      'LOAN_REPAYMENT_IN': '#10B981',
      'ADJUSTMENT': '#6B7280',
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'IN' ? '⬆️' : '⬇️';
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    updateFilters({ [key]: value });
  };

  const exportLedger = () => {
    // TODO: Implement PDF export
    Alert.alert('Export', 'PDF export will be implemented in Module 6');
  };

  if (isLoading && entries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading ledger...</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ledger</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddLedgerEntry')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportLedger}
          >
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Banner */}
        {console.log('📊 LedgerScreen: Current balance:', balance)}
        <BalanceBanner balance={balance} isLoading={isLoading} />

        {/* Recalculate Balance Button */}
        <View style={styles.recalculateContainer}>
          <TouchableOpacity 
            style={styles.recalculateButton} 
            onPress={recalculateBalance}
          >
            <Text style={styles.recalculateButtonText}>🔄 Recalculate Balance</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Entries</Text>
            <Text style={styles.summaryValue}>{filteredEntries.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total IN</Text>
            <Text style={[styles.summaryValue, styles.positiveValue]}>
              {formatCurrency(
                filteredEntries
                  .filter(e => e.direction === 'IN')
                  .reduce((sum, e) => sum + e.amount, 0)
              )}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total OUT</Text>
            <Text style={[styles.summaryValue, styles.negativeValue]}>
              {formatCurrency(
                filteredEntries
                  .filter(e => e.direction === 'OUT')
                  .reduce((sum, e) => sum + e.amount, 0)
              )}
            </Text>
          </View>
        </View>

        {/* Ledger Entries */}
        <View style={styles.entriesContainer}>
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No ledger entries found</Text>
            {Object.values(filters).some(f => f !== null) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredEntries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryTypeContainer}>
                  <Text style={styles.entryTypeIcon}>
                    {getDirectionIcon(entry.direction)}
                  </Text>
                  <Text style={styles.entryType}>
                    {getTypeLabel(entry.type)}
                  </Text>
                </View>
                <Text style={[
                  styles.entryAmount,
                  { color: entry.direction === 'IN' ? '#10B981' : '#EF4444' }
                ]}>
                  {entry.direction === 'IN' ? '+' : '-'}{formatCurrency(entry.amount)}
                </Text>
              </View>
              
              <View style={styles.entryDetails}>
                <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
                {entry.member_id && (
                  <Text style={styles.entryMember}>
                    Member: {(entry as any).member?.full_name || 'Unknown'}
                  </Text>
                )}
                <Text style={styles.entryCreatedBy}>
                  By: {(entry as any).created_by_user?.full_name || 'Unknown'}
                </Text>
              </View>
            </View>
          ))
        )}
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Ledger</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCloseButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateInputs}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>From</Text>
                  <TextInput
                    style={styles.input}
                    value={filters.startDate || ''}
                    onChangeText={(text) => handleFilterChange('startDate', text || null)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>To</Text>
                  <TextInput
                    style={styles.input}
                    value={filters.endDate || ''}
                    onChangeText={(text) => handleFilterChange('endDate', text || null)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Type</Text>
              <View style={styles.typeButtons}>
                {['CONTRIBUTION_IN', 'BENEFIT_OUT', 'LOAN_OUT', 'LOAN_REPAYMENT_IN', 'ADJUSTMENT'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      filters.type === type && styles.typeButtonActive,
                    ]}
                    onPress={() => handleFilterChange('type', filters.type === type ? null : type)}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      filters.type === type && styles.typeButtonTextActive,
                    ]}>
                      {getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Direction</Text>
              <View style={styles.directionButtons}>
                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    filters.direction === 'IN' && styles.directionButtonActive,
                  ]}
                  onPress={() => handleFilterChange('direction', filters.direction === 'IN' ? null : 'IN')}
                >
                  <Text style={[
                    styles.directionButtonText,
                    filters.direction === 'IN' && styles.directionButtonTextActive,
                  ]}>
                    IN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    filters.direction === 'OUT' && styles.directionButtonActive,
                  ]}
                  onPress={() => handleFilterChange('direction', filters.direction === 'OUT' ? null : 'OUT')}
                >
                  <Text style={[
                    styles.directionButtonText,
                    filters.direction === 'OUT' && styles.directionButtonTextActive,
                  ]}>
                    OUT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={() => {
                clearFilters();
                setShowFilters(false);
              }}
            >
              <Text style={styles.clearAllButtonText}>Clear All Filters</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
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
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recalculateContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recalculateButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  recalculateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
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
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
  },
  entriesContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding to avoid menu overlap
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTypeIcon: {
    fontSize: 16,
  },
  entryType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  entryDetails: {
    gap: 4,
  },
  entryDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  entryMember: {
    fontSize: 14,
    color: '#6B7280',
  },
  entryCreatedBy: {
    fontSize: 14,
    color: '#6B7280',
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
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  filterGroup: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  directionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  directionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  directionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  directionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  directionButtonTextActive: {
    color: '#FFFFFF',
  },
  clearAllButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  clearAllButtonText: {
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
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});