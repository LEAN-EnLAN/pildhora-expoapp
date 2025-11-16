/**
 * Navigation Utilities
 * 
 * Utilities for handling navigation state persistence, deep linking,
 * and navigation parameter management for the caregiver dashboard.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const NAVIGATION_STATE_KEY = '@pildhora:navigation_state';
const LAST_ROUTE_KEY = '@pildhora:last_route';

/**
 * Navigation state interface
 */
export interface NavigationState {
  index: number;
  routes: Array<{
    name: string;
    params?: Record<string, any>;
    state?: NavigationState;
  }>;
}

/**
 * Deep link configuration for caregiver routes
 */
export const caregiverDeepLinkConfig = {
  screens: {
    caregiver: {
      path: 'caregiver',
      screens: {
        dashboard: 'dashboard',
        tasks: 'tasks',
        medications: {
          path: 'medications',
          screens: {
            index: '',
            '[patientId]': {
              path: ':patientId',
              screens: {
                index: '',
                add: 'add',
                '[id]': ':id',
              },
            },
          },
        },
        events: {
          path: 'events',
          screens: {
            index: '',
            '[id]': ':id',
          },
        },
        'add-device': 'add-device',
      },
    },
  },
};

/**
 * Save navigation state to AsyncStorage
 */
export async function saveNavigationState(state: NavigationState): Promise<void> {
  try {
    await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[Navigation] Failed to save navigation state:', error);
  }
}

/**
 * Load navigation state from AsyncStorage
 */
export async function loadNavigationState(): Promise<NavigationState | null> {
  try {
    const stateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
    return stateString ? JSON.parse(stateString) : null;
  } catch (error) {
    console.error('[Navigation] Failed to load navigation state:', error);
    return null;
  }
}

/**
 * Clear saved navigation state
 */
export async function clearNavigationState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
  } catch (error) {
    console.error('[Navigation] Failed to clear navigation state:', error);
  }
}

/**
 * Save last visited route
 */
export async function saveLastRoute(route: string, params?: Record<string, any>): Promise<void> {
  try {
    await AsyncStorage.setItem(
      LAST_ROUTE_KEY,
      JSON.stringify({ route, params, timestamp: Date.now() })
    );
  } catch (error) {
    console.error('[Navigation] Failed to save last route:', error);
  }
}

/**
 * Load last visited route
 */
export async function loadLastRoute(): Promise<{ route: string; params?: Record<string, any> } | null> {
  try {
    const routeString = await AsyncStorage.getItem(LAST_ROUTE_KEY);
    if (!routeString) return null;

    const data = JSON.parse(routeString);
    // Only return route if it was saved within the last 24 hours
    const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
    return isRecent ? { route: data.route, params: data.params } : null;
  } catch (error) {
    console.error('[Navigation] Failed to load last route:', error);
    return null;
  }
}

/**
 * Parse deep link URL and extract route information
 */
export function parseDeepLink(url: string): { route: string; params: Record<string, any> } | null {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    
    // Only handle pildhora.com URLs
    if (hostname !== 'pildhora.com') {
      return null;
    }

    // Extract route from pathname
    const route = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    
    // Extract query parameters
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return { route, params };
  } catch (error) {
    console.error('[Navigation] Failed to parse deep link:', error);
    return null;
  }
}

/**
 * Handle deep link navigation
 */
export async function handleDeepLink(
  url: string,
  navigate: (route: string, params?: Record<string, any>) => void
): Promise<boolean> {
  const linkData = parseDeepLink(url);
  
  if (!linkData) {
    return false;
  }

  const { route, params } = linkData;
  
  // Validate that route is a caregiver route
  if (!route.startsWith('caregiver/')) {
    return false;
  }

  // Navigate to the route
  navigate(route, params);
  
  // Save as last route
  await saveLastRoute(route, params);
  
  return true;
}

/**
 * Get initial URL for deep linking
 */
export async function getInitialURL(): Promise<string | null> {
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    console.error('[Navigation] Failed to get initial URL:', error);
    return null;
  }
}

/**
 * Subscribe to deep link events
 */
export function subscribeToDeepLinks(
  handler: (url: string) => void
): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handler(url);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Build deep link URL for a route
 */
export function buildDeepLink(route: string, params?: Record<string, any>): string {
  const baseUrl = 'https://pildhora.com';
  const url = new URL(`${baseUrl}/${route}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  return url.toString();
}

/**
 * Navigation parameter types for type safety
 */
export interface CaregiverNavigationParams {
  dashboard: undefined;
  tasks: undefined;
  medications: undefined;
  events: undefined;
  'add-device': undefined;
  'events/[id]': { id: string };
  'medications/[patientId]': { patientId: string };
  'medications/[patientId]/add': { patientId: string };
  'medications/[patientId]/[id]': { patientId: string; id: string };
}

/**
 * Type-safe navigation helper
 */
export function navigateToRoute<T extends keyof CaregiverNavigationParams>(
  navigate: (route: string, params?: any) => void,
  route: T,
  params?: CaregiverNavigationParams[T]
): void {
  navigate(route, params);
}
