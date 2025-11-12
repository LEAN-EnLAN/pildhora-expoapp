import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getRdbInstance } from '../firebase';
import { ref, set, update } from 'firebase/database';

/**
 * Registers push notification tokens for the authenticated user:
 * - Requests permissions
 * - Retrieves device push token (FCM on Android when configured)
 * - Retrieves Expo push token (optional)
 * - Stores tokens under users/{uid}/fcmTokens and users/{uid}/expoPushTokens in RTDB
 */
export async function ensurePushTokensRegistered(userId: string): Promise<void> {
  try {
    if (!userId) return;

    // Ask for permissions
    const perms = await Notifications.getPermissionsAsync();
    let finalStatus = perms.status;
    if (finalStatus !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
    }
    if (finalStatus !== 'granted') {
      // Do not fail, just skip registration if user denied
      return;
    }

    // Device push token (FCM on Android when properly configured via google-services.json)
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      if (deviceToken?.type === 'fcm' && deviceToken.data) {
        const rdb = await getRdbInstance();
        await set(ref(rdb, `users/${userId}/fcmTokens/${deviceToken.data}`), true);
      } else if (deviceToken?.type && deviceToken.data) {
        // Store non-FCM device tokens for reference
        const rdb = await getRdbInstance();
        await set(ref(rdb, `users/${userId}/devicePushTokens/${deviceToken.type}/${deviceToken.data}`), true);
      }
    } catch (e) {
      // Ignore if platform not supported or not configured
      console.warn('[Notifications] Failed to obtain device push token:', e);
    }

    // Expo push token (optional, useful for dev/testing or if you choose Expo push service)
    try {
      const expoToken = await Notifications.getExpoPushTokenAsync();
      if (expoToken?.data) {
        const rdb = await getRdbInstance();
        await set(ref(rdb, `users/${userId}/expoPushTokens/${expoToken.data}`), true);
      }
    } catch (e) {
      // Ignore if Expo push not configured
      console.warn('[Notifications] Failed to obtain Expo push token:', e);
    }

    // Mark last registration metadata
    const rdb = await getRdbInstance();
    await update(ref(rdb, `users/${userId}/notifications/meta`), {
      lastRegisteredAt: Date.now(),
      platform: Platform.OS,
    });
  } catch (error) {
    console.error('[Notifications] ensurePushTokensRegistered error:', error);
  }
}

/**
 * Convenience to unregister a given token (e.g., on logout) — optional.
 */
export async function unregisterFcmToken(userId: string, token: string): Promise<void> {
  try {
    if (!userId || !token) return;
    const rdb = await getRdbInstance();
    await set(ref(rdb, `users/${userId}/fcmTokens/${token}`), null);
  } catch (e) {
    console.warn('[Notifications] Failed to unregister FCM token:', e);
  }
}

