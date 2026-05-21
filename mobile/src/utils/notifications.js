import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HABIT_REMINDER_ENABLED_KEY = 'habit_reminder_enabled';
export const HABIT_REMINDER_NOTIFICATION_IDS_KEY = 'habit_reminder_notification_ids';
export const HABIT_REMINDER_LAST_SCHEDULED_FOR_KEY = 'habit_reminder_last_scheduled_for';
export const HABIT_REMINDER_LAST_COUNT_KEY = 'habit_reminder_last_count';
const HABIT_REMINDER_CHANNEL_ID = 'habit-reminders';
const REMINDER_HOURS = [6, 10, 14, 18, 22];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const initializeNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(HABIT_REMINDER_CHANNEL_ID, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
};

export const loadHabitReminderSettings = async () => {
  const [enabledValue] = await AsyncStorage.multiGet([HABIT_REMINDER_ENABLED_KEY]);

  return {
    enabled: enabledValue?.[1] === 'true',
  };
};

export const requestNotificationPermissions = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

export const hasNotificationPermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  return !!existing.granted;
};

export const cancelHabitReminder = async () => {
  const notificationIdsRaw = await AsyncStorage.getItem(HABIT_REMINDER_NOTIFICATION_IDS_KEY);
  const notificationIds = notificationIdsRaw ? JSON.parse(notificationIdsRaw) : [];

  for (const notificationId of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore missing/cancelled notifications and keep local state in sync.
    }
  }

  await AsyncStorage.multiRemove([
    HABIT_REMINDER_NOTIFICATION_IDS_KEY,
    HABIT_REMINDER_LAST_SCHEDULED_FOR_KEY,
    HABIT_REMINDER_LAST_COUNT_KEY,
  ]);
};

export const scheduleHabitReminder = async (dateKey, remainingCount = 0) => {
  await cancelHabitReminder();

  const notificationIds = [];
  const now = new Date();
  const [yearRaw, monthRaw, dayRaw] = String(dateKey || '').split('-').map(Number);
  const targetDate = Number.isFinite(yearRaw) && Number.isFinite(monthRaw) && Number.isFinite(dayRaw)
    ? new Date(yearRaw, monthRaw - 1, dayRaw)
    : new Date(now);

  const safeRemainingCount = Math.max(0, Number(remainingCount) || 0);

  for (const hour of REMINDER_HOURS) {
    const triggerDate = new Date(targetDate);
    triggerDate.setHours(hour, 0, 0, 0);

    if (triggerDate <= now) continue;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to fill in your habits',
        body: safeRemainingCount === 1
          ? 'You have 1 habit remaining to be completed.'
          : `You have ${safeRemainingCount} habits remaining to be completed.`,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === 'android' ? { channelId: HABIT_REMINDER_CHANNEL_ID } : {}),
      },
    });

    notificationIds.push(notificationId);
  }

  await AsyncStorage.multiSet([
    [HABIT_REMINDER_NOTIFICATION_IDS_KEY, JSON.stringify(notificationIds)],
    [HABIT_REMINDER_LAST_SCHEDULED_FOR_KEY, dateKey || new Date().toISOString().slice(0, 10)],
    [HABIT_REMINDER_LAST_COUNT_KEY, String(safeRemainingCount)],
  ]);

  return notificationIds;
};

export const persistHabitReminderSettings = async ({ enabled }) => {
  await AsyncStorage.setItem(HABIT_REMINDER_ENABLED_KEY, enabled ? 'true' : 'false');
};

export const loadLastHabitReminderScheduleDate = async () => {
  return AsyncStorage.getItem(HABIT_REMINDER_LAST_SCHEDULED_FOR_KEY);
};

export const loadLastHabitReminderCount = async () => {
  const value = await AsyncStorage.getItem(HABIT_REMINDER_LAST_COUNT_KEY);
  return value ? Number(value) : null;
};
