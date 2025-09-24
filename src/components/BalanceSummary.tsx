import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BalanceInfo } from '../types';

interface BalanceSummaryProps {
  balance: BalanceInfo | null;
  isLoading?: boolean;
  showDetails?: boolean;
}

export default function BalanceSummary({ balance, isLoading, showDetails = false }: BalanceSummaryProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading balance...</Text>
      </View>
    );
  }

  if (!balance) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load balance</Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  const getSpendableColor = () => {
    if (balance.spendable <= 0) return '#EF4444';
    if (balance.spendable < balance.available * 0.1) return '#F59E0B';
    return '#10B981';
  };

  const getSpendableStatus = () => {
    if (balance.spendable <= 0) return 'No funds available';
    if (balance.spendable < balance.available * 0.1) return 'Low funds';
    return 'Healthy';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Balance Summary</Text>
        <View style={[styles.statusIndicator, { backgroundColor: getSpendableColor() }]} />
      </View>

      <View style={styles.balanceGrid}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance.available)}</Text>
          <Text style={styles.balanceSubtext}>Total funds</Text>
        </View>

        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Reserve</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance.reserve)}</Text>
          <Text style={styles.balanceSubtext}>Minimum balance</Text>
        </View>

        <View style={styles.balanceItem}>
          <Text style={[styles.balanceLabel, styles.spendableLabel]}>Spendable</Text>
          <Text style={[styles.balanceAmount, styles.spendableAmount, { color: getSpendableColor() }]}>
            {formatCurrency(balance.spendable)}
          </Text>
          <Text style={[styles.balanceSubtext, { color: getSpendableColor() }]}>
            {getSpendableStatus()}
          </Text>
        </View>
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Available Balance</Text>
            <Text style={styles.detailValue}>{formatCurrency(balance.available)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reserve Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(balance.reserve)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Spendable Amount</Text>
            <Text style={[styles.detailValue, { color: getSpendableColor() }]}>
              {formatCurrency(balance.spendable)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reserve Percentage</Text>
            <Text style={styles.detailValue}>
              {balance.available > 0 ? ((balance.reserve / balance.available) * 100).toFixed(1) : '0'}%
            </Text>
          </View>
        </View>
      )}

      {balance.spendable <= 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            No funds available for new approvals. Consider adding contributions or reducing reserve.
          </Text>
        </View>
      )}

      {balance.spendable > 0 && balance.spendable < balance.available * 0.1 && (
        <View style={styles.cautionBox}>
          <Text style={styles.cautionIcon}>⚡</Text>
          <Text style={styles.cautionText}>
            Low spendable balance. New requests may need to be waitlisted.
          </Text>
        </View>
      )}

      {balance.spendable >= balance.available * 0.1 && (
        <View style={styles.healthyBox}>
          <Text style={styles.healthyIcon}>✅</Text>
          <Text style={styles.healthyText}>
            Healthy balance. Ready for new approvals.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  spendableLabel: {
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  spendableAmount: {
    fontSize: 20,
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  cautionBox: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cautionIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  cautionText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  healthyBox: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  healthyIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  healthyText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#EF4444',
    padding: 20,
  },
});