/**
 * Error Handling Integration Tests
 * 
 * Tests the integration of ErrorBoundary, ErrorState, and OfflineIndicator
 * Tests complete error handling flows and recovery scenarios
 */

import React, { useState } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { ErrorState } from '../ErrorState';
import { OfflineIndicator } from '../OfflineIndicator';
import { ErrorCategory } from '../../../utils/errorHandling';

// Mock dependencies
jest.mock('../../../utils/errorHandling', () => ({
  logError: jest.fn().mockResolvedValue(undefined),
  ApplicationError: jest.fn().mockImplementation((category, message, userMessage, severity) => ({
    category,
    message,
    userMessage,
    severity,
  })),
  ErrorCategory: {
    NETWORK: 'NETWORK',
    PERMISSION: 'PERMISSION',
    INITIALIZATION: 'INITIALIZATION',
    NOT_FOUND: 'NOT_FOUND',
    UNKNOWN: 'UNKNOWN',
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
}));

jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({
    isOnline: true,
    isInternetReachable: true,
    type: 'wifi',
    queueStatus: {
      pending: 0,
      processing: 0,
      failed: 0,
    },
  })),
}));

jest.mock('../../../services/offlineQueueManager', () => ({
  offlineQueueManager: {
    onSyncComplete: jest.fn(() => jest.fn()),
    getQueueStatus: jest.fn(() => ({
      pending: 0,
      processing: 0,
      failed: 0,
    })),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../ui', () => ({
  Button: ({ children, onPress, accessibilityLabel }: any) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <Text>{children}</Text>
      </TouchableOpacity>
    );
  },
}));

import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

describe('Error Handling Integration', () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
  const originalError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isInternetReachable: true,
      type: 'wifi',
      queueStatus: {
        pending: 0,
        processing: 0,
        failed: 0,
      },
    });
  });

  describe('ErrorBoundary with ErrorState', () => {
    it('uses ErrorState as custom fallback', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const customFallback = (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => (
        <ErrorState
          title="Error Capturado"
          message={error.message}
          category={ErrorCategory.UNKNOWN}
          onRetry={retry}
        />
      );

      const { getByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Error Capturado')).toBeTruthy();
      expect(getByText('Test error')).toBeTruthy();
      expect(getByText('Reintentar')).toBeTruthy();
    });

    it('handles network errors with appropriate category', () => {
      const ThrowNetworkError = () => {
        const error = new Error('Network request failed');
        (error as any).code = 'NETWORK_ERROR';
        throw error;
      };

      const customFallback = (error: Error) => (
        <ErrorState
          message={error.message}
          category={ErrorCategory.NETWORK}
        />
      );

      const { getByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowNetworkError />
        </ErrorBoundary>
      );

      expect(getByText('Error de Conexión')).toBeTruthy();
    });
  });

  describe('Complete Error Recovery Flow', () => {
    it('recovers from error after retry', () => {
      const ComponentWithError = ({ shouldError }: { shouldError: boolean }) => {
        if (shouldError) {
          throw new Error('Temporary error');
        }
        return <Text>Success</Text>;
      };

      const TestWrapper = () => {
        const [hasError, setHasError] = useState(true);

        const customFallback = (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => (
          <ErrorState
            message={error.message}
            onRetry={() => {
              setHasError(false);
              retry();
            }}
          />
        );

        return (
          <ErrorBoundary fallback={customFallback}>
            <ComponentWithError shouldError={hasError} />
          </ErrorBoundary>
        );
      };

      const { getByText, queryByText } = render(<TestWrapper />);

      // Initially shows error
      expect(getByText('Temporary error')).toBeTruthy();

      // Click retry
      const retryButton = getByText('Reintentar');
      fireEvent.press(retryButton);

      // Should show success after retry
      waitFor(() => {
        expect(queryByText('Temporary error')).toBeNull();
        expect(getByText('Success')).toBeTruthy();
      });
    });
  });

  describe('Offline Mode with Error Handling', () => {
    it('shows offline indicator and error state together', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: false,
        isInternetReachable: false,
        type: null,
        queueStatus: {
          pending: 0,
          processing: 0,
          failed: 0,
        },
      });

      const { getByText } = render(
        <View>
          <OfflineIndicator />
          <ErrorState
            message="No se pueden cargar los datos"
            category={ErrorCategory.NETWORK}
          />
        </View>
      );

      expect(getByText(/Sin conexión/)).toBeTruthy();
      expect(getByText('No se pueden cargar los datos')).toBeTruthy();
    });

    it('handles offline errors with retry', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: false,
        isInternetReachable: false,
        type: null,
        queueStatus: {
          pending: 0,
          processing: 0,
          failed: 0,
        },
      });

      const onRetry = jest.fn();

      const { getByText } = render(
        <View>
          <OfflineIndicator />
          <ErrorState
            message="Error de red"
            category={ErrorCategory.NETWORK}
            onRetry={onRetry}
          />
        </View>
      );

      const retryButton = getByText('Reintentar');
      fireEvent.press(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Multiple Error States', () => {
    it('handles multiple error categories', () => {
      const { getByText } = render(
        <View>
          <ErrorState
            message="Network error"
            category={ErrorCategory.NETWORK}
          />
          <ErrorState
            message="Permission error"
            category={ErrorCategory.PERMISSION}
          />
        </View>
      );

      expect(getByText('Error de Conexión')).toBeTruthy();
      expect(getByText('Permiso Denegado')).toBeTruthy();
    });
  });

  describe('Error State Transitions', () => {
    it('transitions from loading to error to success', async () => {
      const DataComponent = ({ state }: { state: 'loading' | 'error' | 'success' }) => {
        if (state === 'loading') {
          return <Text>Cargando...</Text>;
        }
        if (state === 'error') {
          return (
            <ErrorState
              message="Error al cargar"
              onRetry={() => {}}
            />
          );
        }
        return <Text>Datos cargados</Text>;
      };

      const TestWrapper = () => {
        const [state, setState] = useState<'loading' | 'error' | 'success'>('loading');

        return (
          <View>
            <DataComponent state={state} />
            <TouchableOpacity onPress={() => setState('error')}>
              <Text>Trigger Error</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setState('success')}>
              <Text>Trigger Success</Text>
            </TouchableOpacity>
          </View>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // Initial loading state
      expect(getByText('Cargando...')).toBeTruthy();

      // Transition to error
      fireEvent.press(getByText('Trigger Error'));
      await waitFor(() => {
        expect(getByText('Error al cargar')).toBeTruthy();
      });

      // Transition to success
      fireEvent.press(getByText('Trigger Success'));
      await waitFor(() => {
        expect(getByText('Datos cargados')).toBeTruthy();
      });
    });
  });

  describe('Nested Error Boundaries', () => {
    it('catches errors at appropriate boundary level', () => {
      const InnerError = () => {
        throw new Error('Inner error');
      };

      const OuterComponent = () => (
        <View>
          <Text>Outer component</Text>
          <ErrorBoundary
            fallback={(error) => (
              <ErrorState message={`Inner: ${error.message}`} />
            )}
          >
            <InnerError />
          </ErrorBoundary>
        </View>
      );

      const { getByText } = render(
        <ErrorBoundary
          fallback={(error) => (
            <ErrorState message={`Outer: ${error.message}`} />
          )}
        >
          <OuterComponent />
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(getByText('Inner: Inner error')).toBeTruthy();
      expect(getByText('Outer component')).toBeTruthy();
    });
  });

  describe('Error Logging Integration', () => {
    it('logs errors through error handling system', async () => {
      const { logError } = require('../../../utils/errorHandling');
      
      const ThrowError = () => {
        throw new Error('Logged error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(logError).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility in Error States', () => {
    it('maintains accessibility during error states', () => {
      const onRetry = jest.fn();

      const { getByLabelText } = render(
        <ErrorState
          message="Accessible error"
          onRetry={onRetry}
          retryLabel="Retry Action"
        />
      );

      const retryButton = getByLabelText('Retry Action');
      expect(retryButton).toBeTruthy();
      
      fireEvent.press(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });
  });
});
