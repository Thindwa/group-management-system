import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BalanceInfo } from '../types';

interface BalanceBannerProps {
  balance: BalanceInfo | null;
  isLoading?: boolean;
}

const BalanceBanner = memo(function BalanceBanner({ balance, isLoading }: BalanceBannerProps) {
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
    if (balance.spendable <= 0) return '#ff4444';
    if (balance.spendable < balance.available * 0.1) return '#ff9500';
    return '#34c759';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Balance</Text>
        <View style={[styles.statusIndicator, { backgroundColor: getSpendableColor() }]} />
      </View>

      <View style={styles.balanceGrid}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance.available)}</Text>
        </View>

        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Reserve</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance.reserve)}</Text>
        </View>

        <View style={styles.balanceItem}>
          <Text style={[styles.balanceLabel, styles.spendableLabel]}>Spendable</Text>
          <Text style={[styles.balanceAmount, styles.spendableAmount, { color: getSpendableColor() }]}>
            {formatCurrency(balance.spendable)}
          </Text>
        </View>
      </View>

      {balance.spendable <= 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ No funds available for new approvals. Consider adding contributions or reducing reserve.
          </Text>
        </View>
      )}

      {balance.spendable > 0 && balance.spendable < balance.available * 0.1 && (
        <View style={styles.cautionBox}>
          <Text style={styles.cautionText}>
            ⚡ Low spendable balance. New requests may need to be waitlisted.
          </Text>
        </View>
      )}
    </View>
  );
});

export default BalanceBanner;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  spendableLabel: {
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  spendableAmount: {
    fontSize: 18,
  },
  warningBox: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  warningText: {
    fontSize: 14,
    color: '#c62828',
    fontWeight: '500',
  },
  cautionBox: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  cautionText: {
    fontSize: 14,
    color: '#ef6c00',
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ff4444',
    padding: 20,
  },
});
