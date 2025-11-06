import { Stack } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from '../src/store';
import { useEffect } from 'react';
import { ensurePushTokensRegistered } from '../src/services/notifications/push';
import { Platform } from 'react-native';

// Extend Window interface for testing
declare global {
  interface Window {
    __REDUX_STORE__?: typeof store;
  }
}

function NotificationsBootstrapper() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  // Gate push registration behind an env flag to avoid Expo Go iOS warnings
  const enablePush = process.env.EXPO_PUBLIC_ENABLE_PUSH_REGISTRATION === 'true';

  useEffect(() => {
    if (isAuthenticated && userId && enablePush) {
      // Register tokens when user session becomes available
      ensurePushTokensRegistered(userId);
    }
  }, [isAuthenticated, userId]);

  return null;
}

export default function RootLayout() {
  // Expose store to window for testing in browser
  if (typeof window !== 'undefined') {
    window.__REDUX_STORE__ = store;
  }
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* Bootstrap notifications token registration */}
        <NotificationsBootstrapper />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
        </Stack>
      </PersistGate>
    </Provider>
  );
}
