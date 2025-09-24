import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { useGroupStore } from '../../stores/groupStore';
import { GroupSettings, ContributionStrategy, WaitlistPolicy } from '../../types';

export default function SettingsScreen() {
  const {
    groupSettings,
    currentGroup,
    isLoading,
    error,
    loadGroupSettings,
    updateGroupSettings,
    refreshData,
  } = useGroupStore();

  const [settings, setSettings] = useState<Partial<GroupSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentGroup) {
      loadGroupSettings(currentGroup.id);
    }
  }, [currentGroup]);

  useEffect(() => {
    if (groupSettings) {
      setSettings(groupSettings);
    }
  }, [groupSettings]);

  const handleSave = async () => {
    if (!hasChanges) return;

    const success = await updateGroupSettings(settings);
    if (success) {
      setHasChanges(false);
      Alert.alert('Success', 'Settings updated successfully');
    } else {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const updateSetting = (key: keyof GroupSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const formatCurrency = (amount: number) => {
    return `MK ${amount.toLocaleString()}`;
  };

  if (isLoading && !groupSettings) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Settings</Text>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Contribution Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contribution Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Default Amount</Text>
          <TextInput
            style={styles.currencyInput}
            value={settings.contribution_amount_default?.toString() || ''}
            onChangeText={(text) => updateSetting('contribution_amount_default', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="10000"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Strategy</Text>
          <View style={styles.strategyButtons}>
            {(['MONTHLY', 'INTERVAL_DAYS', 'INSTALLMENTS_PER_CIRCLE'] as ContributionStrategy[]).map((strategy) => (
              <TouchableOpacity
                key={strategy}
                style={[
                  styles.strategyButton,
                  settings.contribution_strategy === strategy && styles.strategyButtonActive,
                ]}
                onPress={() => updateSetting('contribution_strategy', strategy)}
              >
                <Text style={[
                  styles.strategyButtonText,
                  settings.contribution_strategy === strategy && styles.strategyButtonTextActive,
                ]}>
                  {strategy.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {settings.contribution_strategy === 'INTERVAL_DAYS' && (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Interval (Days)</Text>
            <TextInput
              style={styles.numberInput}
              value={settings.contribution_interval_days?.toString() || ''}
              onChangeText={(text) => updateSetting('contribution_interval_days', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="90"
            />
          </View>
        )}

        {settings.contribution_strategy === 'INSTALLMENTS_PER_CIRCLE' && (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Installments per Circle</Text>
            <TextInput
              style={styles.numberInput}
              value={settings.installments_per_circle?.toString() || ''}
              onChangeText={(text) => updateSetting('installments_per_circle', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="4"
            />
          </View>
        )}

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Allow Member Override</Text>
          <Switch
            value={settings.allow_member_override || false}
            onValueChange={(value) => updateSetting('allow_member_override', value)}
          />
        </View>
      </View>

      {/* Benefit Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Benefit Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Funeral Benefit</Text>
          <TextInput
            style={styles.currencyInput}
            value={settings.funeral_benefit?.toString() || ''}
            onChangeText={(text) => updateSetting('funeral_benefit', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="50000"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sickness Benefit</Text>
          <TextInput
            style={styles.currencyInput}
            value={settings.sickness_benefit?.toString() || ''}
            onChangeText={(text) => updateSetting('sickness_benefit', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="30000"
          />
        </View>
      </View>

      {/* Loan Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Interest Rate (%)</Text>
          <TextInput
            style={styles.numberInput}
            value={settings.loan_interest_percent?.toString() || ''}
            onChangeText={(text) => updateSetting('loan_interest_percent', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="20"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Period (Days)</Text>
          <TextInput
            style={styles.numberInput}
            value={settings.loan_period_days?.toString() || ''}
            onChangeText={(text) => updateSetting('loan_period_days', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="30"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Grace Period (Days)</Text>
          <TextInput
            style={styles.numberInput}
            value={settings.grace_period_days?.toString() || ''}
            onChangeText={(text) => updateSetting('grace_period_days', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="5"
          />
        </View>
      </View>

      {/* Waitlist Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Waitlist Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Reserve Min Balance</Text>
          <TextInput
            style={styles.currencyInput}
            value={settings.reserve_min_balance?.toString() || ''}
            onChangeText={(text) => updateSetting('reserve_min_balance', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto Waitlist if Insufficient</Text>
          <Switch
            value={settings.auto_waitlist_if_insufficient || false}
            onValueChange={(value) => updateSetting('auto_waitlist_if_insufficient', value)}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Auto Process Waitlist</Text>
          <Switch
            value={settings.auto_waitlist_processing || false}
            onValueChange={(value) => updateSetting('auto_waitlist_processing', value)}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Waitlist Policy</Text>
          <View style={styles.policyButtons}>
            {(['FIFO', 'BENEFITS_FIRST', 'LOANS_FIRST'] as WaitlistPolicy[]).map((policy) => (
              <TouchableOpacity
                key={policy}
                style={[
                  styles.policyButton,
                  settings.waitlist_policy === policy && styles.policyButtonActive,
                ]}
                onPress={() => updateSetting('waitlist_policy', policy)}
              >
                <Text style={[
                  styles.policyButtonText,
                  settings.waitlist_policy === policy && styles.policyButtonTextActive,
                ]}>
                  {policy.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Circle Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Circle Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Duration (Days)</Text>
          <TextInput
            style={styles.numberInput}
            value={settings.circle_duration_days?.toString() || ''}
            onChangeText={(text) => updateSetting('circle_duration_days', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="365"
          />
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  currencyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 120,
    textAlign: 'right',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 80,
    textAlign: 'right',
  },
  strategyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strategyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  strategyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  strategyButtonText: {
    fontSize: 12,
    color: '#666',
  },
  strategyButtonTextActive: {
    color: '#fff',
  },
  policyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  policyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  policyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  policyButtonText: {
    fontSize: 12,
    color: '#666',
  },
  policyButtonTextActive: {
    color: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#ff4444',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});