import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useGroupStore } from '../../stores/groupStore';
import { useAuth } from '../../hooks/useAuth';

export default function CreateGroupScreen({ navigation }: any) {
  const { createGroup } = useGroupStore();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [groupData, setGroupData] = useState({
    name: '',
    currency: 'MWK',
  });

  const handleCreateGroup = async () => {
    if (!groupData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!session) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    setIsLoading(true);
    try {
      const success = await createGroup(groupData);
      if (success) {
        Alert.alert(
          'Success',
          'Group created successfully! You are now the group administrator.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Dashboard'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create group. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Group</Text>
        <Text style={styles.subtitle}>
          Set up a new savings group with configurable settings
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            value={groupData.name}
            onChangeText={(text) => setGroupData(prev => ({ ...prev, name: text }))}
            placeholder="Enter group name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Currency</Text>
          <View style={styles.currencyButtons}>
            {['MWK', 'USD', 'EUR', 'GBP'].map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[
                  styles.currencyButton,
                  groupData.currency === currency && styles.currencyButtonActive,
                ]}
                onPress={() => setGroupData(prev => ({ ...prev, currency }))}
              >
                <Text style={[
                  styles.currencyButtonText,
                  groupData.currency === currency && styles.currencyButtonTextActive,
                ]}>
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Default Settings</Text>
          <Text style={styles.infoText}>
            Your group will be created with these default settings:
          </Text>
          <View style={styles.settingsList}>
            <Text style={styles.settingItem}>• Contribution: MK 10,000 per installment</Text>
            <Text style={styles.settingItem}>• Strategy: 4 installments per circle</Text>
            <Text style={styles.settingItem}>• Funeral benefit: MK 50,000</Text>
            <Text style={styles.settingItem}>• Sickness benefit: MK 30,000</Text>
            <Text style={styles.settingItem}>• Loan interest: 20% per period</Text>
            <Text style={styles.settingItem}>• Loan period: 30 days</Text>
            <Text style={styles.settingItem}>• Grace period: 5 days</Text>
            <Text style={styles.settingItem}>• Circle duration: 365 days</Text>
          </View>
          <Text style={styles.infoNote}>
            You can modify these settings after creating the group.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating Group...' : 'Create Group'}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
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
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  currencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  currencyButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  currencyButtonTextActive: {
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  settingsList: {
    marginBottom: 12,
  },
  settingItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
