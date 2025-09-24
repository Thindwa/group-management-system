import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { NotificationService } from '../../services/notifications';
import { useGroupStore } from '../../stores/groupStore';
import { useContributionStore } from '../../stores/contributionStore';
import { useBenefitStore } from '../../stores/benefitStore';
import { useLoanStore } from '../../stores/loanStore';

export default function NotificationsScreen() {
  const { currentGroup, currentCircle, members } = useGroupStore();
  const { contributions } = useContributionStore();
  const { benefits } = useBenefitStore();
  const { loans } = useLoanStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [settings, setSettings] = useState({
    contributionReminders: true,
    loanReminders: true,
    benefitApprovals: true,
    loanApprovals: true,
    waitlistPromotions: true,
    circleRollovers: true,
    dailySummaries: false,
  });

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    const enabled = await NotificationService.initialize();
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      await NotificationService.createNotificationCategories();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeNotifications();
    setRefreshing(false);
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTestNotification = async () => {
    if (!notificationsEnabled) {
      Alert.alert('Notifications Disabled', 'Please enable notifications first');
      return;
    }

    const success = await NotificationService.sendImmediateNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the Group Management System',
      categoryId: 'summary',
    });

    if (success) {
      Alert.alert('Success', 'Test notification sent');
    } else {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleScheduleReminders = async () => {
    if (!notificationsEnabled) {
      Alert.alert('Notifications Disabled', 'Please enable notifications first');
      return;
    }

    try {
      let scheduled = 0;

      // Schedule contribution reminders
      if (settings.contributionReminders) {
        const contributionAmount = 10000; // Default amount
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

        for (const member of members) {
          await NotificationService.scheduleContributionReminder(
            member.full_name,
            contributionAmount,
            dueDate
          );
          scheduled++;
        }
      }

      // Schedule loan payment reminders
      if (settings.loanReminders) {
        const activeLoans = loans.filter(l => l.status === 'ACTIVE');
        for (const loan of activeLoans) {
          const member = members.find(m => m.id === loan.member_id);
          if (member) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14); // Due in 14 days

            await NotificationService.scheduleLoanPaymentReminder(
              member.full_name,
              loan.principal,
              dueDate
            );
            scheduled++;
          }
        }
      }

      Alert.alert('Success', `Scheduled ${scheduled} reminders`);
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule reminders');
    }
  };

  const handleClearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await NotificationService.cancelAllNotifications();
            if (success) {
              Alert.alert('Success', 'All notifications cleared');
            } else {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const getNotificationStats = () => {
    const scheduled = 0; // Would get from NotificationService.getScheduledNotifications()
    const totalMembers = members.length;
    const activeLoans = loans.filter(l => l.status === 'ACTIVE').length;
    const pendingBenefits = benefits.filter(b => b.status === 'PENDING').length;

    return {
      scheduled,
      totalMembers,
      activeLoans,
      pendingBenefits,
    };
  };

  const stats = getNotificationStats();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          {currentGroup?.name || 'Unknown Group'}
        </Text>
      </View>

      {/* Notification Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>
            {notificationsEnabled ? '🔔' : '🔕'}
          </Text>
          <Text style={styles.statusTitle}>
            {notificationsEnabled ? 'Notifications Enabled' : 'Notifications Disabled'}
          </Text>
          <Text style={styles.statusDescription}>
            {notificationsEnabled 
              ? 'You will receive notifications for important events'
              : 'Enable notifications to receive updates about your group'
            }
          </Text>
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>Notification Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Contribution Reminders</Text>
            <Text style={styles.settingDescription}>
              Remind members about upcoming contribution payments
            </Text>
          </View>
          <Switch
            value={settings.contributionReminders}
            onValueChange={(value) => handleSettingChange('contributionReminders', value)}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Loan Payment Reminders</Text>
            <Text style={styles.settingDescription}>
              Remind members about upcoming loan payments
            </Text>
          </View>
          <Switch
            value={settings.loanReminders}
            onValueChange={(value) => handleSettingChange('loanReminders', value)}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Benefit Approvals</Text>
            <Text style={styles.settingDescription}>
              Notify members when their benefit requests are approved
            </Text>
          </View>
          <Switch
            value={settings.benefitApprovals}
            onValueChange={(value) => handleSettingChange('benefitApprovals', value)}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Loan Approvals</Text>
            <Text style={styles.settingDescription}>
              Notify members when their loan requests are approved
            </Text>
          </View>
          <Switch
            value={settings.loanApprovals}
            onValueChange={(value) => handleSettingChange('loanApprovals', value)}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Waitlist Promotions</Text>
            <Text style={styles.settingDescription}>
              Notify members when their waitlisted items are promoted
            </Text>
          </View>
          <Switch
            value={settings.waitlistPromotions}
            onValueChange={(value) => handleSettingChange('waitlistPromotions', value)}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Circle Rollovers</Text>
            <Text style={styles.settingDescription}>
              Notify members when the circle is rolled over
            </Text>
          </View>
          <Switch
            value={settings.circleRollovers}
            onValueChange={(value) => handleSettingChange('circleRollovers', value)}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Summaries</Text>
            <Text style={styles.settingDescription}>
              Send daily summary of group activities
            </Text>
          </View>
          <Switch
            value={settings.dailySummaries}
            onValueChange={(value) => handleSettingChange('dailySummaries', value)}
            disabled={!notificationsEnabled}
          />
        </View>
      </View>

      {/* Notification Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Notification Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.scheduled}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalMembers}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeLoans}</Text>
            <Text style={styles.statLabel}>Active Loans</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendingBenefits}</Text>
            <Text style={styles.statLabel}>Pending Benefits</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.testButton]}
          onPress={handleTestNotification}
          disabled={!notificationsEnabled}
        >
          <Text style={styles.actionButtonText}>Send Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.scheduleButton]}
          onPress={handleScheduleReminders}
          disabled={!notificationsEnabled}
        >
          <Text style={styles.actionButtonText}>Schedule Reminders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearAllNotifications}
        >
          <Text style={styles.actionButtonText}>Clear All Notifications</Text>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statusContainer: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsContainer: {
    padding: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  statsContainer: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#3B82F6',
  },
  scheduleButton: {
    backgroundColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
