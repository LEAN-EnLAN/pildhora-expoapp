import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
// @ts-ignore – redux-persist lacks bundled types
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from '../src/store';
import { useEffect, useState } from 'react';
import { ensurePushTokensRegistered } from '../src/services/notifications/push';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { lowQuantityNotificationService } from '../src/services/lowQuantityNotification';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

function InventoryCheckBootstrapper() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [hasRunInitialCheck, setHasRunInitialCheck] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Run initial check on mount
  useEffect(() => {
    const runInitialCheck = async () => {
      if (!isAuthenticated || userRole !== 'patient' || !userId || hasRunInitialCheck) {
        return;
      }

      try {
        console.log('[InventoryCheck] Running initial inventory check');
        
        const shouldRun = await lowQuantityNotificationService.shouldRunDailyCheck();
        
        if (shouldRun) {
          await lowQuantityNotificationService.checkAllMedicationsForLowInventory(userId);
          await lowQuantityNotificationService.markDailyCheckComplete();
          console.log('[InventoryCheck] Initial check complete');
        } else {
          console.log('[InventoryCheck] Daily check already run today');
        }
        
        setHasRunInitialCheck(true);
      } catch (error) {
        console.error('[InventoryCheck] Error during initial check:', error);
      }
    };

    runInitialCheck();
  }, [isAuthenticated, userRole, userId, hasRunInitialCheck]);

  // Check on app foreground
  useEffect(() => {
    const checkInventoryOnForeground = async () => {
      // Only check for patients when app comes to foreground
      if (
        isAuthenticated &&
        userRole === 'patient' &&
        userId &&
        appState === 'active'
      ) {
        try {
          console.log('[InventoryCheck] App foregrounded, checking inventory');
          
          const shouldRun = await lowQuantityNotificationService.shouldRunDailyCheck();
          
          if (shouldRun) {
            await lowQuantityNotificationService.checkAllMedicationsForLowInventory(userId);
            await lowQuantityNotificationService.markDailyCheckComplete();
            console.log('[InventoryCheck] Foreground check complete');
          } else {
            console.log('[InventoryCheck] Daily check already run today');
          }
        } catch (error) {
          console.error('[InventoryCheck] Error during foreground check:', error);
        }
      }
    };

    checkInventoryOnForeground();
  }, [isAuthenticated, userRole, userId, appState]);

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
        {/* Bootstrap daily inventory checks */}
        <InventoryCheckBootstrapper />
        <SafeAreaProvider>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: motion.duration.medium,
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{
                animation: 'fade',
              }}
            />
            <Stack.Screen 
              name="auth/login"
              options={{
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen 
              name="auth/signup"
              options={{
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen 
              name="patient"
            />
            <Stack.Screen 
              name="caregiver"
            />
          </Stack>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
import { motion } from '../src/theme/motion';
