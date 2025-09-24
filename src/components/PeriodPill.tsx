import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PeriodPillProps {
  period: number;
  total: number;
  status: 'upcoming' | 'current' | 'completed' | 'overdue';
}

export default function PeriodPill({ period, total, status }: PeriodPillProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'upcoming':
        return '#6B7280';
      case 'current':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'current':
        return 'Current';
      case 'completed':
        return 'Completed';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={[styles.container, { borderColor: getStatusColor() }]}>
      <Text style={[styles.periodText, { color: getStatusColor() }]}>
        {period}/{total}
      </Text>
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});