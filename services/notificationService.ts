import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') return false;

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
};

export const scheduleAffirmationReminders = async (morningTime: string, eveningTime: string) => {
  if (Platform.OS === 'web') return;

  // 1. Cancel all existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Schedule Morning Notification
  const [mHours, mMinutes] = morningTime.split(':').map(Number);
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
  const [eHours, eMinutes] = eveningTime.split(':').map(Number);
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
};
