import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLedgerStore } from '../../stores/ledgerStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';

export default function AddLedgerEntryScreen({ navigation }: any) {
  const { addLedgerEntry } = useLedgerStore();
  const { currentGroup, currentCircle } = useGroupStore();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [entry, setEntry] = useState({
    type: 'ADJUSTMENT' as const,
    amount: '',
    direction: 'IN' as 'IN' | 'OUT',
    note: '',
  });

  const handleSave = async () => {
    if (!currentGroup || !currentCircle || !session?.user?.id) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    if (!entry.amount || isNaN(Number(entry.amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const success = await addLedgerEntry({
        group_id: currentGroup.id,
        circle_id: currentCircle.id,
        member_id: null,
        type: entry.type,
        ref_id: `adjustment_${Date.now()}`,
        amount: Number(entry.amount),
        direction: entry.direction,
        created_by: session.user.id,
      });

      if (success) {
        Alert.alert('Success', 'Ledger entry added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to add ledger entry');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = Number(amount);
    return isNaN(num) ? '' : `MK ${num.toLocaleString()}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Ledger Entry</Text>
        <Text style={styles.subtitle}>Manual balance adjustment</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Type *</Text>
          <View style={styles.typeButtons}>
            {['CONTRIBUTION_IN', 'BENEFIT_OUT', 'LOAN_OUT', 'LOAN_REPAYMENT_IN', 'ADJUSTMENT'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  entry.type === type && styles.typeButtonActive,
                ]}
                onPress={() => setEntry(prev => ({ ...prev, type: type as any }))}
              >
                <Text style={[
                  styles.typeButtonText,
                  entry.type === type && styles.typeButtonTextActive,
                ]}>
                  {type.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Direction *</Text>
          <View style={styles.directionButtons}>
            <TouchableOpacity
              style={[
                styles.directionButton,
                entry.direction === 'IN' && styles.directionButtonActive,
              ]}
              onPress={() => setEntry(prev => ({ ...prev, direction: 'IN' }))}
            >
              <Text style={[
                styles.directionButtonText,
                entry.direction === 'IN' && styles.directionButtonTextActive,
              ]}>
                IN (+)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.directionButton,
                entry.direction === 'OUT' && styles.directionButtonActive,
              ]}
              onPress={() => setEntry(prev => ({ ...prev, direction: 'OUT' }))}
            >
              <Text style={[
                styles.directionButtonText,
                entry.direction === 'OUT' && styles.directionButtonTextActive,
              ]}>
                OUT (-)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
          <TextInput
            style={styles.input}
            value={entry.amount}
            onChangeText={(text) => setEntry(prev => ({ ...prev, amount: text }))}
            placeholder="Enter amount"
            keyboardType="numeric"
          />
          {entry.amount && (
            <Text style={styles.amountPreview}>
              {formatCurrency(entry.amount)}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={entry.note}
            onChangeText={(text) => setEntry(prev => ({ ...prev, note: text }))}
            placeholder="Optional note about this entry"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Important</Text>
          <Text style={styles.infoText}>
            Manual ledger entries should only be used for adjustments and corrections. 
            Regular transactions (contributions, loans, benefits) should be created through 
            their respective screens to ensure proper validation and audit trails.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Adding Entry...' : 'Add Entry'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
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
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
    borderRadius: 8,
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
  amountPreview: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
