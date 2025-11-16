/**
 * useNavigationPersistence Hook
 * 
 * Custom hook for persisting and restoring navigation state across app sessions.
 * Handles deep linking and last route restoration.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import {
  saveNavigationState,
  loadNavigationState,
  saveLastRoute,
  loadLastRoute,
  getInitialURL,
  subscribeToDeepLinks,
  handleDeepLink,
  NavigationState,
} from '../utils/navigation';

interface UseNavigationPersistenceOptions {
  enabled?: boolean;
  persistLastRoute?: boolean;
  handleDeepLinks?: boolean;
}

interface UseNavigationPersistenceReturn {
  isReady: boolean;
  initialState: NavigationState | null;
}

/**
 * Hook for managing navigation state persistence
 */
export function useNavigationPersistence(
  options: UseNavigationPersistenceOptions = {}
): UseNavigationPersistenceReturn {
  const {
    enabled = true,
    persistLastRoute = true,
    handleDeepLinks: enableDeepLinks = true,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState | null>(null);
  const lastPathnameRef = useRef<string>(pathname);

  // Load initial navigation state
  useEffect(() => {
    if (!enabled) {
      setIsReady(true);
      return;
    }

    const loadInitialState = async () => {
      try {
        // Check for deep link first
        if (enableDeepLinks) {
          const initialUrl = await getInitialURL();
          if (initialUrl) {
            const handled = await handleDeepLink(initialUrl, (route, params) => {
              router.push({ pathname: `/${route}`, params } as any);
            });
            
            if (handled) {
              setIsReady(true);
              return;
            }
          }
        }

        // Try to restore last route
        if (persistLastRoute) {
          const lastRoute = await loadLastRoute();
          if (lastRoute) {
            router.push({ pathname: `/${lastRoute.route}`, params: lastRoute.params } as any);
            setIsReady(true);
            return;
          }
        }

        // Load saved navigation state
        const savedState = await loadNavigationState();
        if (savedState) {
          setInitialState(savedState);
        }
      } catch (error) {
        console.error('[useNavigationPersistence] Failed to load initial state:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadInitialState();
  }, [enabled, enableDeepLinks, persistLastRoute]);

  // Subscribe to deep link events
  useEffect(() => {
    if (!enabled || !enableDeepLinks) {
      return;
    }

    const unsubscribe = subscribeToDeepLinks((url) => {
      handleDeepLink(url, (route, params) => {
        router.push({ pathname: `/${route}`, params } as any);
      });
    });

    return unsubscribe;
  }, [enabled, enableDeepLinks, router]);

  // Save current route when it changes
  useEffect(() => {
    if (!enabled || !persistLastRoute) {
      return;
    }

    // Only save if pathname actually changed
    if (pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname;
      
      // Extract route without leading slash
      const route = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      
      // Don't save auth routes or root
      if (!route.startsWith('auth/') && route !== '') {
        saveLastRoute(route);
      }
    }
  }, [pathname, enabled, persistLastRoute]);

  return {
    isReady,
    initialState,
  };
}

/**
 * Hook for saving navigation state on app state changes
 */
export function useNavigationStateSaver(
  getState: () => NavigationState | undefined,
  enabled: boolean = true
): void {
  const stateRef = useRef<NavigationState | undefined>(undefined);
  const getStateRef = useRef<() => NavigationState | undefined>(getState);

  // Update ref when getState changes
  useEffect(() => {
    getStateRef.current = getState;
  }, [getState]);

  // Save state periodically
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = setInterval(() => {
      const currentState = getStateRef.current();
      if (currentState && currentState !== stateRef.current) {
        stateRef.current = currentState;
        saveNavigationState(currentState);
      }
    }, 5000); // Save every 5 seconds if state changed

    return () => clearInterval(interval);
  }, [enabled]);

  // Save state on unmount
  useEffect(() => {
    return () => {
      if (enabled) {
        const finalState = getStateRef.current();
        if (finalState) {
          saveNavigationState(finalState);
        }
      }
    };
  }, [enabled]);
}
