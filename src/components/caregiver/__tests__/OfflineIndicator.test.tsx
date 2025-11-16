/**
 * OfflineIndicator Component Tests
 * 
 * Tests offline mode detection, sync status display, and animations
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { OfflineIndicator } from '../OfflineIndicator';
import { offlineQueueManager } from '../../../services/offlineQueueManager';

// Mock hooks
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

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock offline queue manager
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

// Import after mocks
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

describe('OfflineIndicator', () => {
  const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
  const mockOnSyncComplete = offlineQueueManager.onSyncComplete as jest.MockedFunction<typeof offlineQueueManager.onSyncComplete>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mock implementation
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

    mockOnSyncComplete.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Online State', () => {
    it('does not render when online with no pending items', () => {
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

      const { container } = render(<OfflineIndicator />);
      
      expect(container.children.length).toBe(0);
    });

    it('accepts isOnline override prop', () => {
      const { queryByText } = render(<OfflineIndicator isOnline={true} />);
      
      expect(queryByText(/Sin conexión/)).toBeNull();
    });
  });

  describe('Offline State', () => {
    it('displays offline banner when not connected', () => {
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

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText(/Sin conexión/)).toBeTruthy();
    });

    it('shows offline message with local save info', () => {
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

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText(/Los cambios se guardarán localmente/)).toBeTruthy();
    });

    it('displays offline icon', () => {
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

      const { UNSAFE_getByType } = render(<OfflineIndicator />);
      
      const icon = UNSAFE_getByType('Ionicons');
      expect(icon.props.name).toBe('cloud-offline');
    });

    it('uses isOnline override when offline', () => {
      const { getByText } = render(<OfflineIndicator isOnline={false} />);
      
      expect(getByText(/Sin conexión/)).toBeTruthy();
    });
  });

  describe('Sync Status', () => {
    it('displays pending changes count', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isInternetReachable: true,
        type: 'wifi',
        queueStatus: {
          pending: 3,
          processing: 0,
          failed: 0,
        },
      });

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText(/3 cambios pendientes/)).toBeTruthy();
    });

    it('displays singular form for one pending change', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isInternetReachable: true,
        type: 'wifi',
        queueStatus: {
          pending: 1,
          processing: 0,
          failed: 0,
        },
      });

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText(/1 cambio pendiente/)).toBeTruthy();
    });

    it('displays processing status', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isInternetReachable: true,
        type: 'wifi',
        queueStatus: {
          pending: 0,
          processing: 2,
          failed: 0,
        },
      });

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText(/Sincronizando 2 cambios/)).toBeTruthy();
    });

    it('displays singular form for one processing change', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isInternetReachable: true,
        type: 'wifi',
        queueStatus: {
          pending: 0,
          processing: 1,
          failed: 0,
        },
      });

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText(/Sincronizando 1 cambio/)).toBeTruthy();
    });

    it('shows sync icon when processing', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isInternetReachable: true,
        type: 'wifi',
        queueStatus: {
          pending: 0,
          processing: 1,
          failed: 0,
        },
      });

      const { UNSAFE_getByType } = render(<OfflineIndicator />);
      
      const icon = UNSAFE_getByType('Ionicons');
      expect(icon.props.name).toBe('sync');
    });

    it('shows upload icon when pending', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isInternetReachable: true,
        type: 'wifi',
        queueStatus: {
          pending: 2,
          processing: 0,
          failed: 0,
        },
      });

      const { UNSAFE_getByType } = render(<OfflineIndicator />);
      
      const icon = UNSAFE_getByType('Ionicons');
      expect(icon.props.name).toBe('cloud-upload');
    });
  });

  describe('Sync Success', () => {
    it('displays success message after sync completion', async () => {
      let syncCallback: ((success: boolean) => void) | null = null;
      
      mockOnSyncComplete.mockImplementation((callback) => {
        syncCallback = callback;
        return jest.fn();
      });

      const { getByText } = render(<OfflineIndicator />);

      // Trigger sync completion
      act(() => {
        if (syncCallback) {
          syncCallback(true);
        }
      });

      await waitFor(() => {
        expect(getByText('Cambios sincronizados')).toBeTruthy();
      });
    });

    it('shows success icon after sync', async () => {
      let syncCallback: ((success: boolean) => void) | null = null;
      
      mockOnSyncComplete.mockImplementation((callback) => {
        syncCallback = callback;
        return jest.fn();
      });

      const { UNSAFE_getByType } = render(<OfflineIndicator />);

      act(() => {
        if (syncCallback) {
          syncCallback(true);
        }
      });

      await waitFor(() => {
        const icon = UNSAFE_getByType('Ionicons');
        expect(icon.props.name).toBe('checkmark-circle');
      });
    });

    it('hides success message after timeout', async () => {
      let syncCallback: ((success: boolean) => void) | null = null;
      
      mockOnSyncComplete.mockImplementation((callback) => {
        syncCallback = callback;
        return jest.fn();
      });

      const { getByText, queryByText } = render(<OfflineIndicator />);

      act(() => {
        if (syncCallback) {
          syncCallback(true);
        }
      });

      await waitFor(() => {
        expect(getByText('Cambios sincronizados')).toBeTruthy();
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(queryByText('Cambios sincronizados')).toBeNull();
      });
    });

    it('does not show success message on failed sync', () => {
      let syncCallback: ((success: boolean) => void) | null = null;
      
      mockOnSyncComplete.mockImplementation((callback) => {
        syncCallback = callback;
        return jest.fn();
      });

      const { queryByText } = render(<OfflineIndicator />);

      act(() => {
        if (syncCallback) {
          syncCallback(false);
        }
      });

      expect(queryByText('Cambios sincronizados')).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('unsubscribes from sync events on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockOnSyncComplete.mockReturnValue(mockUnsubscribe);

      const { unmount } = render(<OfflineIndicator />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Priority Display', () => {
    it('prioritizes sync success over other states', async () => {
      let syncCallback: ((success: boolean) => void) | null = null;
      
      mockOnSyncComplete.mockImplementation((callback) => {
        syncCallback = callback;
        return jest.fn();
      });

      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isInternetReachable: true,
        type: 'wifi',
        queueStatus: {
          pending: 2,
          processing: 0,
          failed: 0,
        },
      });

      const { getByText } = render(<OfflineIndicator />);

      act(() => {
        if (syncCallback) {
          syncCallback(true);
        }
      });

      await waitFor(() => {
        expect(getByText('Cambios sincronizados')).toBeTruthy();
      });
    });

    it('shows offline state over pending changes', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: false,
        isInternetReachable: false,
        type: null,
        queueStatus: {
          pending: 3,
          processing: 0,
          failed: 0,
        },
      });

      const { getByText, queryByText } = render(<OfflineIndicator />);
      
      expect(getByText(/Sin conexión/)).toBeTruthy();
      expect(queryByText(/pendiente/)).toBeNull();
    });

    it('shows processing over pending', () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isInternetReachable: true,
        type: 'wifi',
        queueStatus: {
          pending: 3,
          processing: 1,
          failed: 0,
        },
      });

      const { getByText, queryByText } = render(<OfflineIndicator />);
      
      expect(getByText(/Sincronizando/)).toBeTruthy();
      expect(queryByText(/pendiente/)).toBeNull();
    });
  });
});
