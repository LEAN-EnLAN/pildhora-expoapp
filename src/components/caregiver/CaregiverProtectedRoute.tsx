/**
 * CaregiverProtectedRoute Component
 * 
 * Higher-order component that protects caregiver routes by verifying:
 * - User is authenticated
 * - User has caregiver role
 * - Session is valid
 * 
 * Redirects to login if unauthorized
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useCaregiverSecurity } from '../../hooks/useCaregiverSecurity';
import { ErrorState } from './ErrorState';
import { colors, spacing } from '../../theme/tokens';

export interface CaregiverProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Protected route component for caregiver screens
 * 
 * @param children - Child components to render if authorized
 * @param fallback - Optional fallback component while loading
 * @param showError - Whether to show error state (default: true)
 */
export function CaregiverProtectedRoute({
  children,
  fallback,
  showError = true,
}: CaregiverProtectedRouteProps) {
  const { isLoading, isAuthorized, error, user } = useCaregiverSecurity(true);

  // Show loading state
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Show error state if not authorized
  if (!isAuthorized || !user) {
    if (showError && error) {
      return (
        <ErrorState
          title="Access Denied"
          message={error}
          onRetry={() => window.location.reload()}
        />
      );
    }

    // Redirect will happen automatically via useCaregiverSecurity hook
    return null;
  }

  // Render children if authorized
  return <>{children}</>;
}

/**
 * Higher-order component to wrap caregiver screens
 * 
 * @param Component - Component to wrap
 * @returns Wrapped component with protection
 */
export function withCaregiverProtection<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    return (
      <CaregiverProtectedRoute>
        <Component {...props} />
      </CaregiverProtectedRoute>
    );
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
});
