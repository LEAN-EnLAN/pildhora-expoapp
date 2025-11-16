/**
 * ErrorState Component Tests
 * 
 * Tests error state display, retry functionality, and category-specific rendering
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorState } from '../ErrorState';
import { ErrorCategory } from '../../../utils/errorHandling';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock UI components
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

describe('ErrorState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders error message', () => {
      const { getByText } = render(
        <ErrorState message="Test error message" />
      );

      expect(getByText('Test error message')).toBeTruthy();
    });

    it('renders default title when not provided', () => {
      const { getByText } = render(
        <ErrorState message="Test error" />
      );

      expect(getByText('Error')).toBeTruthy();
    });

    it('renders custom title when provided', () => {
      const { getByText } = render(
        <ErrorState title="Custom Error Title" message="Test error" />
      );

      expect(getByText('Custom Error Title')).toBeTruthy();
    });

    it('shows icon by default', () => {
      const { UNSAFE_getByType } = render(
        <ErrorState message="Test error" />
      );

      expect(UNSAFE_getByType('Ionicons')).toBeTruthy();
    });

    it('hides icon when showIcon is false', () => {
      const { UNSAFE_queryByType } = render(
        <ErrorState message="Test error" showIcon={false} />
      );

      expect(UNSAFE_queryByType('Ionicons')).toBeNull();
    });
  });

  describe('Error Categories', () => {
    it('displays network error icon and title', () => {
      const { getByText, UNSAFE_getByType } = render(
        <ErrorState message="Network error" category={ErrorCategory.NETWORK} />
      );

      expect(getByText('Error de Conexión')).toBeTruthy();
      const icon = UNSAFE_getByType('Ionicons');
      expect(icon.props.name).toBe('cloud-offline-outline');
    });

    it('displays permission error icon and title', () => {
      const { getByText, UNSAFE_getByType } = render(
        <ErrorState message="Permission denied" category={ErrorCategory.PERMISSION} />
      );

      expect(getByText('Permiso Denegado')).toBeTruthy();
      const icon = UNSAFE_getByType('Ionicons');
      expect(icon.props.name).toBe('lock-closed-outline');
    });

    it('displays initialization error icon and title', () => {
      const { getByText, UNSAFE_getByType } = render(
        <ErrorState message="Init failed" category={ErrorCategory.INITIALIZATION} />
      );

      expect(getByText('Error de Inicialización')).toBeTruthy();
      const icon = UNSAFE_getByType('Ionicons');
      expect(icon.props.name).toBe('warning-outline');
    });

    it('displays not found error icon and title', () => {
      const { getByText, UNSAFE_getByType } = render(
        <ErrorState message="Not found" category={ErrorCategory.NOT_FOUND} />
      );

      expect(getByText('No Encontrado')).toBeTruthy();
      const icon = UNSAFE_getByType('Ionicons');
      expect(icon.props.name).toBe('search-outline');
    });

    it('displays default error icon for unknown category', () => {
      const { getByText, UNSAFE_getByType } = render(
        <ErrorState message="Unknown error" />
      );

      expect(getByText('Error')).toBeTruthy();
      const icon = UNSAFE_getByType('Ionicons');
      expect(icon.props.name).toBe('alert-circle-outline');
    });
  });

  describe('Retry Functionality', () => {
    it('shows retry button when onRetry is provided', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState message="Test error" onRetry={onRetry} />
      );

      expect(getByText('Reintentar')).toBeTruthy();
    });

    it('hides retry button when onRetry is not provided', () => {
      const { queryByText } = render(
        <ErrorState message="Test error" />
      );

      expect(queryByText('Reintentar')).toBeNull();
    });

    it('calls onRetry when retry button is pressed', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState message="Test error" onRetry={onRetry} />
      );

      const retryButton = getByText('Reintentar');
      fireEvent.press(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('displays custom retry label', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState 
          message="Test error" 
          onRetry={onRetry} 
          retryLabel="Intentar de nuevo"
        />
      );

      expect(getByText('Intentar de nuevo')).toBeTruthy();
    });

    it('sets correct accessibility label on retry button', () => {
      const onRetry = jest.fn();
      const { getByLabelText } = render(
        <ErrorState message="Test error" onRetry={onRetry} />
      );

      expect(getByLabelText('Reintentar')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const onRetry = jest.fn();
      const { getByLabelText } = render(
        <ErrorState 
          message="Test error" 
          onRetry={onRetry}
          retryLabel="Retry"
        />
      );

      expect(getByLabelText('Retry')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('renders with all props combined', () => {
      const onRetry = jest.fn();
      const { getByText } = render(
        <ErrorState
          title="Custom Title"
          message="Custom message"
          category={ErrorCategory.NETWORK}
          onRetry={onRetry}
          retryLabel="Try Again"
          showIcon={true}
        />
      );

      expect(getByText('Custom Title')).toBeTruthy();
      expect(getByText('Custom message')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });
  });
});
