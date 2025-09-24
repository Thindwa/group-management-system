import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LedgerEntry } from '../types';

interface LedgerEntryCardProps {
  entry: LedgerEntry & {
    member?: { full_name: string; phone: string };
    created_by_user?: { full_name: string; phone: string };
  };
  onPress?: () => void;
}

export default function LedgerEntryCard({ entry, onPress }: LedgerEntryCardProps) {
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

  const getDirectionColor = (direction: string) => {
    return direction === 'IN' ? '#10B981' : '#EF4444';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>
            {getDirectionIcon(entry.direction)}
          </Text>
          <View>
            <Text style={styles.typeLabel}>
              {getTypeLabel(entry.type)}
            </Text>
            <Text style={styles.dateText}>
              {formatDate(entry.created_at)}
            </Text>
          </View>
        </View>
        <Text style={[
          styles.amount,
          { color: getDirectionColor(entry.direction) }
        ]}>
          {entry.direction === 'IN' ? '+' : '-'}{formatCurrency(entry.amount)}
        </Text>
      </View>

      <View style={styles.details}>
        {entry.member_id && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Member:</Text>
            <Text style={styles.detailValue}>
              {entry.member?.full_name || 'Unknown'}
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created by:</Text>
          <Text style={styles.detailValue}>
            {entry.created_by_user?.full_name || 'Unknown'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reference:</Text>
          <Text style={styles.detailValue}>
            {entry.ref_id.slice(0, 8)}...
          </Text>
        </View>
      </View>

      <View style={[
        styles.typeIndicator,
        { backgroundColor: getTypeColor(entry.type) }
      ]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  typeIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  typeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});
