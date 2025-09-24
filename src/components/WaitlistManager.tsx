import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useBenefitStore } from '../stores/benefitStore';
import { useGroupStore } from '../stores/groupStore';
import { Benefit } from '../types';

interface WaitlistManagerProps {
  onPromote?: () => void;
}

export default function WaitlistManager({ onPromote }: WaitlistManagerProps) {
  const { currentGroup, currentCircle, groupSettings } = useGroupStore();
  const { waitlistedBenefits, promoteWaitlist, isLoading } = useBenefitStore();
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    if (currentGroup && currentCircle) {
      // Benefits are loaded by parent component
    }
  }, [currentGroup, currentCircle]);

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

  const getTypeIcon = (type: string) => {
    const icons = {
      FUNERAL: '🕊️',
      SICKNESS: '🏥',
    };
    return icons[type as keyof typeof icons] || '❓';
  };

  const getWaitlistStatus = (benefit: Benefit) => {
    const waitlistedAt = benefit.waitlisted_at ? new Date(benefit.waitlisted_at) : null;
    const now = new Date();
    
    if (!waitlistedAt) return 'Unknown';
    
    const daysSinceWaitlisted = Math.floor((now.getTime() - waitlistedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceWaitlisted < 1) return 'Just waitlisted';
    if (daysSinceWaitlisted < 7) return `${daysSinceWaitlisted} days`;
    if (daysSinceWaitlisted < 30) return `${Math.floor(daysSinceWaitlisted / 7)} weeks`;
    return `${Math.floor(daysSinceWaitlisted / 30)} months`;
  };

  const handlePromoteWaitlist = async () => {
    if (!groupSettings) {
      Alert.alert('Error', 'Group settings not available');
      return;
    }

    setPromoting(true);
    try {
      const success = await promoteWaitlist();
      if (success) {
        Alert.alert('Success', 'Waitlist promotion completed');
        onPromote?.();
      } else {
        Alert.alert('Error', 'Failed to promote waitlist items');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setPromoting(false);
    }
  };

  const getTotalWaitlistAmount = () => {
    return waitlistedBenefits.reduce((sum, benefit) => sum + benefit.amount, 0);
  };

  const getWaitlistByType = () => {
    const funeral = waitlistedBenefits.filter(b => b.type === 'FUNERAL');
    const sickness = waitlistedBenefits.filter(b => b.type === 'SICKNESS');
    
    return {
      funeral: {
        count: funeral.length,
        amount: funeral.reduce((sum, b) => sum + b.amount, 0),
      },
      sickness: {
        count: sickness.length,
        amount: sickness.reduce((sum, b) => sum + b.amount, 0),
      },
    };
  };

  if (!currentGroup || !currentCircle || !groupSettings) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No group or circle data available</Text>
      </View>
    );
  }

  const waitlistByType = getWaitlistByType();
  const totalAmount = getTotalWaitlistAmount();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Waitlist Management</Text>
        <TouchableOpacity
          style={[styles.promoteButton, promoting && styles.promoteButtonDisabled]}
          onPress={handlePromoteWaitlist}
          disabled={promoting || waitlistedBenefits.length === 0}
        >
          <Text style={styles.promoteButtonText}>
            {promoting ? 'Promoting...' : 'Promote Waitlist'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Waitlist Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{waitlistedBenefits.length}</Text>
          <Text style={styles.summaryLabel}>Total Waitlisted</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{formatCurrency(totalAmount)}</Text>
          <Text style={styles.summaryLabel}>Total Amount</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {formatCurrency(groupSettings.reserve_min_balance || 0)}
          </Text>
          <Text style={styles.summaryLabel}>Reserve Balance</Text>
        </View>
      </View>

      {/* Waitlist by Type */}
      <View style={styles.typeContainer}>
        <Text style={styles.typeTitle}>Waitlist by Type</Text>
        <View style={styles.typeRow}>
          <View style={styles.typeItem}>
            <Text style={styles.typeIcon}>🕊️</Text>
            <Text style={styles.typeLabel}>Funeral</Text>
            <Text style={styles.typeCount}>{waitlistByType.funeral.count}</Text>
            <Text style={styles.typeAmount}>{formatCurrency(waitlistByType.funeral.amount)}</Text>
          </View>
          <View style={styles.typeItem}>
            <Text style={styles.typeIcon}>🏥</Text>
            <Text style={styles.typeLabel}>Sickness</Text>
            <Text style={styles.typeCount}>{waitlistByType.sickness.count}</Text>
            <Text style={styles.typeAmount}>{formatCurrency(waitlistByType.sickness.amount)}</Text>
          </View>
        </View>
      </View>

      {/* Waitlist Items */}
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>Waitlist Items</Text>
        {waitlistedBenefits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items on waitlist</Text>
          </View>
        ) : (
          <ScrollView style={styles.itemsList}>
            {waitlistedBenefits
              .sort((a, b) => (a.waitlist_position || 0) - (b.waitlist_position || 0))
              .map((benefit, index) => (
                <View key={benefit.id} style={styles.waitlistItem}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTypeContainer}>
                      <Text style={styles.itemTypeIcon}>
                        {getTypeIcon(benefit.type)}
                      </Text>
                      <View>
                        <Text style={styles.itemType}>{benefit.type}</Text>
                        <Text style={styles.itemMember}>
                          {(benefit as any).member?.full_name || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemPositionContainer}>
                      <Text style={styles.itemPosition}>
                        #{benefit.waitlist_position || index + 1}
                      </Text>
                      <Text style={styles.itemAmount}>
                        {formatCurrency(benefit.amount)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemReason}>{benefit.reason}</Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemDate}>
                        {formatDate(benefit.created_at)}
                      </Text>
                      <Text style={styles.itemStatus}>
                        Waitlisted: {getWaitlistStatus(benefit)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </ScrollView>
        )}
      </View>

      {/* Auto-promotion Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Auto-promotion</Text>
        <Text style={styles.infoText}>
          {groupSettings.auto_waitlist_processing ? (
            'Enabled - Waitlist items will be automatically promoted when funds become available'
          ) : (
            'Disabled - Manual promotion required'
          )}
        </Text>
        <Text style={styles.infoText}>
          Reserve balance: {formatCurrency(groupSettings.reserve_min_balance || 0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#111827',
  },
  promoteButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  promoteButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  promoteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  typeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  typeAmount: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  itemsList: {
    maxHeight: 300,
  },
  waitlistItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  itemType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  itemMember: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemPositionContainer: {
    alignItems: 'flex-end',
  },
  itemPosition: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemDetails: {
    gap: 4,
  },
  itemReason: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  itemStatus: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoContainer: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
    marginBottom: 2,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    padding: 20,
  },
});