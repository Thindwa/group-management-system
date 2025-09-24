
import { Platform } from 'react-native';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
}

export class NotificationService {
  private static isInitialized = false;

  /**
   * Initialize notifications
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Register for push notifications if on device
      if (Device.isDevice) {
        const token = await this.getPushToken();
        if (token) {
          console.log('Push token:', token);
          // Store token in your backend for sending notifications
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   */
  static async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Schedule a local notification
   */
  static async scheduleNotification(
    notification: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: notification.categoryId,
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send immediate notification
   */
  static async sendImmediateNotification(notification: NotificationData): Promise<boolean> {
    try {
      const notificationId = await this.scheduleNotification(notification);
      return notificationId !== null;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return false;
    }
  }

  /**
   * Schedule contribution reminder
   */
  static async scheduleContributionReminder(
    memberName: string,
    amount: number,
    dueDate: Date
  ): Promise<string | null> {
    const title = 'Contribution Reminder';
    const body = `Hi ${memberName}, your contribution of MK ${amount.toLocaleString()} is due on ${dueDate.toLocaleDateString()}`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'contribution' },
      { date: dueDate }
    );
  }

  /**
   * Schedule loan payment reminder
   */
  static async scheduleLoanPaymentReminder(
    memberName: string,
    amount: number,
    dueDate: Date
  ): Promise<string | null> {
    const title = 'Loan Payment Reminder';
    const body = `Hi ${memberName}, your loan payment of MK ${amount.toLocaleString()} is due on ${dueDate.toLocaleDateString()}`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'loan' },
      { date: dueDate }
    );
  }

  /**
   * Schedule benefit approval notification
   */
  static async scheduleBenefitApprovalNotification(
    memberName: string,
    amount: number,
    type: string
  ): Promise<string | null> {
    const title = 'Benefit Approved';
    const body = `Hi ${memberName}, your ${type.toLowerCase()} benefit of MK ${amount.toLocaleString()} has been approved`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'benefit' }
    );
  }

  /**
   * Schedule loan approval notification
   */
  static async scheduleLoanApprovalNotification(
    memberName: string,
    amount: number
  ): Promise<string | null> {
    const title = 'Loan Approved';
    const body = `Hi ${memberName}, your loan of MK ${amount.toLocaleString()} has been approved`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'loan' }
    );
  }

  /**
   * Schedule waitlist promotion notification
   */
  static async scheduleWaitlistPromotionNotification(
    memberName: string,
    type: string,
    amount: number
  ): Promise<string | null> {
    const title = 'Waitlist Promotion';
    const body = `Hi ${memberName}, your ${type.toLowerCase()} request of MK ${amount.toLocaleString()} has been promoted from the waitlist`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'waitlist' }
    );
  }

  /**
   * Schedule circle rollover notification
   */
  static async scheduleCircleRolloverNotification(
    groupName: string,
    newYear: string
  ): Promise<string | null> {
    const title = 'Circle Rollover';
    const body = `The circle for ${groupName} has been rolled over to ${newYear}`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'circle' }
    );
  }

  /**
   * Schedule daily summary notification
   */
  static async scheduleDailySummaryNotification(
    groupName: string,
    summary: {
      contributions: number;
      benefits: number;
      loans: number;
    }
  ): Promise<string | null> {
    const title = 'Daily Summary';
    const body = `${groupName}: ${summary.contributions} contributions, ${summary.benefits} benefits, ${summary.loans} loans today`;
    
    // Schedule for tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'summary' },
      { date: tomorrow }
    );
  }

  /**
   * Create notification categories
   */
  static async createNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('contribution', [
        {
          identifier: 'PAY_NOW',
          buttonTitle: 'Pay Now',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'REMIND_LATER',
          buttonTitle: 'Remind Later',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('loan', [
        {
          identifier: 'VIEW_LOAN',
          buttonTitle: 'View Loan',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'MAKE_PAYMENT',
          buttonTitle: 'Make Payment',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('benefit', [
        {
          identifier: 'VIEW_BENEFIT',
          buttonTitle: 'View Benefit',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('waitlist', [
        {
          identifier: 'VIEW_STATUS',
          buttonTitle: 'View Status',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('circle', [
        {
          identifier: 'VIEW_CIRCLE',
          buttonTitle: 'View Circle',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('summary', [
        {
          identifier: 'VIEW_DASHBOARD',
          buttonTitle: 'View Dashboard',
          options: { opensAppToForeground: true },
        },
      ]);
    } catch (error) {
      console.error('Error creating notification categories:', error);
    }
  }

  /**
   * Handle notification response
   */
  static handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const { actionIdentifier, notification } = response;
    
    console.log('Notification response:', actionIdentifier, notification);
    
    // Handle different action responses
    switch (actionIdentifier) {
      case 'PAY_NOW':
        // Navigate to payment screen
        break;
      case 'VIEW_LOAN':
        // Navigate to loan details
        break;
      case 'MAKE_PAYMENT':
        // Navigate to payment screen
        break;
      case 'VIEW_BENEFIT':
        // Navigate to benefit details
        break;
      case 'VIEW_STATUS':
        // Navigate to waitlist status
        break;
      case 'VIEW_CIRCLE':
        // Navigate to circle screen
        break;
      case 'VIEW_DASHBOARD':
        // Navigate to dashboard
        break;
      default:
        // Default action - open app
        break;
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return { status: 'undetermined', granted: false, canAskAgain: true };
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await this.getNotificationSettings();
      return settings.granted;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }
}
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
}

export class NotificationService {
  private static isInitialized = false;

  /**
   * Initialize notifications
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Register for push notifications if on device
      if (Device.isDevice) {
        const token = await this.getPushToken();
        if (token) {
          console.log('Push token:', token);
          // Store token in your backend for sending notifications
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   */
  static async getPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Schedule a local notification
   */
  static async scheduleNotification(
    notification: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: notification.categoryId,
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send immediate notification
   */
  static async sendImmediateNotification(notification: NotificationData): Promise<boolean> {
    try {
      const notificationId = await this.scheduleNotification(notification);
      return notificationId !== null;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return false;
    }
  }

  /**
   * Schedule contribution reminder
   */
  static async scheduleContributionReminder(
    memberName: string,
    amount: number,
    dueDate: Date
  ): Promise<string | null> {
    const title = 'Contribution Reminder';
    const body = `Hi ${memberName}, your contribution of MK ${amount.toLocaleString()} is due on ${dueDate.toLocaleDateString()}`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'contribution' },
      { date: dueDate }
    );
  }

  /**
   * Schedule loan payment reminder
   */
  static async scheduleLoanPaymentReminder(
    memberName: string,
    amount: number,
    dueDate: Date
  ): Promise<string | null> {
    const title = 'Loan Payment Reminder';
    const body = `Hi ${memberName}, your loan payment of MK ${amount.toLocaleString()} is due on ${dueDate.toLocaleDateString()}`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'loan' },
      { date: dueDate }
    );
  }

  /**
   * Schedule benefit approval notification
   */
  static async scheduleBenefitApprovalNotification(
    memberName: string,
    amount: number,
    type: string
  ): Promise<string | null> {
    const title = 'Benefit Approved';
    const body = `Hi ${memberName}, your ${type.toLowerCase()} benefit of MK ${amount.toLocaleString()} has been approved`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'benefit' }
    );
  }

  /**
   * Schedule loan approval notification
   */
  static async scheduleLoanApprovalNotification(
    memberName: string,
    amount: number
  ): Promise<string | null> {
    const title = 'Loan Approved';
    const body = `Hi ${memberName}, your loan of MK ${amount.toLocaleString()} has been approved`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'loan' }
    );
  }

  /**
   * Schedule waitlist promotion notification
   */
  static async scheduleWaitlistPromotionNotification(
    memberName: string,
    type: string,
    amount: number
  ): Promise<string | null> {
    const title = 'Waitlist Promotion';
    const body = `Hi ${memberName}, your ${type.toLowerCase()} request of MK ${amount.toLocaleString()} has been promoted from the waitlist`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'waitlist' }
    );
  }

  /**
   * Schedule circle rollover notification
   */
  static async scheduleCircleRolloverNotification(
    groupName: string,
    newYear: string
  ): Promise<string | null> {
    const title = 'Circle Rollover';
    const body = `The circle for ${groupName} has been rolled over to ${newYear}`;
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'circle' }
    );
  }

  /**
   * Schedule daily summary notification
   */
  static async scheduleDailySummaryNotification(
    groupName: string,
    summary: {
      contributions: number;
      benefits: number;
      loans: number;
    }
  ): Promise<string | null> {
    const title = 'Daily Summary';
    const body = `${groupName}: ${summary.contributions} contributions, ${summary.benefits} benefits, ${summary.loans} loans today`;
    
    // Schedule for tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    return await this.scheduleNotification(
      { title, body, categoryId: 'summary' },
      { date: tomorrow }
    );
  }

  /**
   * Create notification categories
   */
  static async createNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('contribution', [
        {
          identifier: 'PAY_NOW',
          buttonTitle: 'Pay Now',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'REMIND_LATER',
          buttonTitle: 'Remind Later',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('loan', [
        {
          identifier: 'VIEW_LOAN',
          buttonTitle: 'View Loan',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'MAKE_PAYMENT',
          buttonTitle: 'Make Payment',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('benefit', [
        {
          identifier: 'VIEW_BENEFIT',
          buttonTitle: 'View Benefit',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('waitlist', [
        {
          identifier: 'VIEW_STATUS',
          buttonTitle: 'View Status',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('circle', [
        {
          identifier: 'VIEW_CIRCLE',
          buttonTitle: 'View Circle',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('summary', [
        {
          identifier: 'VIEW_DASHBOARD',
          buttonTitle: 'View Dashboard',
          options: { opensAppToForeground: true },
        },
      ]);
    } catch (error) {
      console.error('Error creating notification categories:', error);
    }
  }

  /**
   * Handle notification response
   */
  static handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const { actionIdentifier, notification } = response;
    
    console.log('Notification response:', actionIdentifier, notification);
    
    // Handle different action responses
    switch (actionIdentifier) {
      case 'PAY_NOW':
        // Navigate to payment screen
        break;
      case 'VIEW_LOAN':
        // Navigate to loan details
        break;
      case 'MAKE_PAYMENT':
        // Navigate to payment screen
        break;
      case 'VIEW_BENEFIT':
        // Navigate to benefit details
        break;
      case 'VIEW_STATUS':
        // Navigate to waitlist status
        break;
      case 'VIEW_CIRCLE':
        // Navigate to circle screen
        break;
      case 'VIEW_DASHBOARD':
        // Navigate to dashboard
        break;
      default:
        // Default action - open app
        break;
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return { status: 'undetermined', granted: false, canAskAgain: true };
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await this.getNotificationSettings();
      return settings.granted;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }
}
