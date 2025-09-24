import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  type?: 'contribution' | 'benefit' | 'loan' | 'general';
}

export default function StatusBadge({ status, type = 'general' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status.toUpperCase()) {
      // Contribution statuses
      case 'PENDING':
        return { color: '#F59E0B', backgroundColor: '#FEF3C7', text: 'Pending' };
      case 'PAID':
        return { color: '#10B981', backgroundColor: '#D1FAE5', text: 'Paid' };
      case 'OVERDUE':
        return { color: '#EF4444', backgroundColor: '#FEE2E2', text: 'Overdue' };
      
      // Benefit statuses
      case 'APPROVED':
        return { color: '#10B981', backgroundColor: '#D1FAE5', text: 'Approved' };
      case 'REJECTED':
        return { color: '#EF4444', backgroundColor: '#FEE2E2', text: 'Rejected' };
      
      // Loan statuses
      case 'ACTIVE':
        return { color: '#3B82F6', backgroundColor: '#DBEAFE', text: 'Active' };
      case 'CLOSED':
        return { color: '#6B7280', backgroundColor: '#F3F4F6', text: 'Closed' };
      
      // General statuses
      case 'COMPLETED':
        return { color: '#10B981', backgroundColor: '#D1FAE5', text: 'Completed' };
      case 'IN_PROGRESS':
        return { color: '#3B82F6', backgroundColor: '#DBEAFE', text: 'In Progress' };
      case 'CANCELLED':
        return { color: '#6B7280', backgroundColor: '#F3F4F6', text: 'Cancelled' };
      
      default:
        return { color: '#6B7280', backgroundColor: '#F3F4F6', text: status };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});