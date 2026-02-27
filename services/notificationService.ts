import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// expo-notifications remote push support was removed from Expo Go in SDK 53.
// Local (scheduled) notifications still work, but we skip all setup in Expo Go
// to avoid the console warning banner that confuses users.
// appOwnership === 'expo' is the canonical way to detect Expo Go across SDK versions.
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification behavior (only in real builds)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const requestNotificationPermissions = async () => {
  try {
    if (Platform.OS === 'web' || isExpoGo) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Notifications] Permission request failed:', e);
    return false;
  }
};

export const scheduleAffirmationReminders = async (morningTime: string, eveningTime: string) => {
  try {
    if (Platform.OS === 'web' || isExpoGo) return;

    // 1. Cancel all existing scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 2. Schedule Morning Notification
    const mParts = (morningTime || '08:00').split(':').map(Number);
    const mHours = isNaN(mParts[0]) ? 8 : mParts[0];
    const mMinutes = isNaN(mParts[1]) ? 0 : mParts[1];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Morning Manifestation 🌅",
        body: "Time to align your frequency. Your affirmations are ready.",
        data: { screen: 'ALIGNER' },
      },
      trigger: {
        hour: mHours,
        minute: mMinutes,
        repeats: true,
      } as Notifications.NotificationTriggerInput,
    });

    // 3. Schedule Evening Notification
    const eParts = (eveningTime || '20:00').split(':').map(Number);
    const eHours = isNaN(eParts[0]) ? 20 : eParts[0];
    const eMinutes = isNaN(eParts[1]) ? 0 : eParts[1];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Evening Reflection 🌙",
        body: "Close your day with gratitude and affirmation.",
        data: { screen: 'ALIGNER' },
      },
      trigger: {
        hour: eHours,
        minute: eMinutes,
        repeats: true,
      } as Notifications.NotificationTriggerInput,
    });

    console.log(`Scheduled notifications for ${morningTime} and ${eveningTime}`);
  } catch (e) {
    console.error('[Notifications] Failed to schedule reminders:', e);
  }
};
