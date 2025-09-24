import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Benefit } from '../types';

interface BenefitRequestCardProps {
  benefit: Benefit & {
    member?: { full_name: string; phone: string };
    created_by_user?: { full_name: string; phone: string };
    reviewed_by_user?: { full_name: string; phone: string };
  };
  onPress?: () => void;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onPay?: () => void;
}

export default function BenefitRequestCard({
  benefit,
  onPress,
  showActions = false,
  onApprove,
  onReject,
  onPay,
}: BenefitRequestCardProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) {
      return 'MK 0';
    }
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

  const getTypeIcon = (type: string) => {
    const icons = {
      FUNERAL: '🕊️',
      SICKNESS: '🏥',
    };
    return icons[type as keyof typeof icons] || '❓';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: '#F59E0B',
      APPROVED: '#10B981',
      REJECTED: '#EF4444',
      WAITLISTED: '#6B7280',
      PAID: '#3B82F6',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const getStatusText = (status: string) => {
    const texts = {
      PENDING: 'Pending Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      WAITLISTED: 'Waitlisted',
      PAID: 'Paid',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: '⏳',
      APPROVED: '✅',
      REJECTED: '❌',
      WAITLISTED: '⏸️',
      PAID: '💰',
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>{getTypeIcon(benefit.type)}</Text>
          <View>
            <Text style={styles.typeLabel}>{benefit.type}</Text>
            <Text style={styles.memberName}>
              {(benefit as any).member?.full_name || 'Unknown'}
            </Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatCurrency(benefit.requested_amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(benefit.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(benefit.status)}</Text>
            <Text style={styles.statusText}>{getStatusText(benefit.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.reason}>{benefit.relative_name}</Text>
        {benefit.relative_type && (
          <Text style={styles.description}>{benefit.relative_type}</Text>
        )}
        
        <View style={styles.metaContainer}>
          <Text style={styles.date}>
            Requested: {formatDate(benefit.created_at)}
          </Text>
          {benefit.waitlist_position && (
            <Text style={styles.waitlistPosition}>
              Waitlist #{benefit.waitlist_position}
            </Text>
          )}
        </View>

        {benefit.reviewed_at && (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewText}>
              Reviewed: {formatDate(benefit.reviewed_at)}
            </Text>
            {(benefit as any).reviewed_by_user && (
              <Text style={styles.reviewerText}>
                by {(benefit as any).reviewed_by_user.full_name}
              </Text>
            )}
          </View>
        )}

        {benefit.paid_at && (
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentText}>
              Paid: {formatDate(benefit.paid_at)}
            </Text>
            {benefit.payment_method && (
              <Text style={styles.paymentMethod}>
                via {benefit.payment_method.replace('_', ' ').toUpperCase()}
              </Text>
            )}
          </View>
        )}
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          {benefit.status === 'PENDING' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={onApprove}
              >
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={onReject}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {benefit.status === 'APPROVED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.payButton]}
              onPress={onPay}
            >
              <Text style={styles.actionButtonText}>Pay</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  details: {
    gap: 8,
  },
  reason: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  waitlistPosition: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  reviewContainer: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
  },
  reviewText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  reviewerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentContainer: {
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 4,
  },
  paymentText: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  payButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
