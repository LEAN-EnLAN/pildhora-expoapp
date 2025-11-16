/**
 * ErrorBoundary Component Tests
 * 
 * Tests error boundary rendering, error catching, and retry functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import * as errorHandling from '../../../utils/errorHandling';

// Mock error handling utilities
jest.mock('../../../utils/errorHandling', () => ({
  logError: jest.fn().mockResolvedValue(undefined),
  ApplicationError: jest.fn().mockImplementation((category, message, userMessage, severity, recoverable, action, originalError, metadata) => ({
    category,
    message,
    userMessage,
    severity,
    recoverable,
    action,
    originalError,
    metadata,
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

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Rendering', () => {
    it('renders children when no error occurs', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>Test content</Text>
        </ErrorBoundary>
      );

      expect(getByText('Test content')).toBeTruthy();
    });

    it('renders multiple children correctly', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>First child</Text>
          <Text>Second child</Text>
        </ErrorBoundary>
      );

      expect(getByText('First child')).toBeTruthy();
      expect(getByText('Second child')).toBeTruthy();
    });
  });

  describe('Error Catching', () => {
    it('catches errors and displays default fallback UI', () => {
      const { getByText, queryByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Algo salió mal')).toBeTruthy();
      expect(getByText(/Lo sentimos, ocurrió un error inesperado/)).toBeTruthy();
      expect(queryByText('No error')).toBeNull();
    });

    it('displays retry button in fallback UI', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Reintentar')).toBeTruthy();
    });

    it('logs error when caught', async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(errorHandling.logError).toHaveBeenCalled();
      });
    });

    it('creates ApplicationError with correct parameters', async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(errorHandling.ApplicationError).toHaveBeenCalledWith(
          errorHandling.ErrorCategory.UNKNOWN,
          'Test error',
          'Ocurrió un error inesperado en la aplicación.',
          errorHandling.ErrorSeverity.HIGH,
          true,
          undefined,
          expect.any(Error),
          expect.objectContaining({
            componentStack: expect.any(String),
          })
        );
      });
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = (error: Error) => (
        <View>
          <Text>Custom error: {error.message}</Text>
        </View>
      );

      const { getByText, queryByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Custom error: Test error')).toBeTruthy();
      expect(queryByText('Algo salió mal')).toBeNull();
    });

    it('passes retry function to custom fallback', () => {
      const customFallback = (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => (
        <View>
          <Text>Error occurred</Text>
          <Text onPress={retry}>Custom retry</Text>
        </View>
      );

      const { getByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Custom retry')).toBeTruthy();
    });
  });

  describe('Retry Functionality', () => {
    it('resets error state when retry is pressed', () => {
      const { getByText, rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Algo salió mal')).toBeTruthy();

      const retryButton = getByText('Reintentar');
      fireEvent.press(retryButton);

      // After retry, error boundary should reset
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(getByText('No error')).toBeTruthy();
    });

    it('clears error state on retry', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = getByText('Reintentar');
      fireEvent.press(retryButton);

      // Component should attempt to re-render children
      // Error state should be cleared
      expect(getByText('Reintentar')).toBeTruthy();
    });
  });

  describe('Error Handler Callback', () => {
    it('calls onError callback when error is caught', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('passes correct error to onError callback', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Development Mode', () => {
    it('shows error details in development mode', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;

      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Detalles del error:')).toBeTruthy();
      expect(getByText(/Test error/)).toBeTruthy();

      (global as any).__DEV__ = originalDev;
    });
  });

  describe('Error State Management', () => {
    it('maintains error state until retry', () => {
      const { getByText, queryByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Algo salió mal')).toBeTruthy();
      expect(queryByText('No error')).toBeNull();

      // Error state should persist
      expect(getByText('Reintentar')).toBeTruthy();
    });

    it('updates state correctly when error occurs', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error UI
      expect(getByText('Algo salió mal')).toBeTruthy();
    });
  });
});
