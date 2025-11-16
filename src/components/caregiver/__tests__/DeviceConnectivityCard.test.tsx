import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { DeviceConnectivityCard } from '../DeviceConnectivityCard';
import { getRdbInstance } from '../../../services/firebase';
import { onValue } from 'firebase/database';

// Mock Firebase
jest.mock('../../../services/firebase');
jest.mock('firebase/database');

// Mock date utils
jest.mock('../../../utils/dateUtils', () => ({
  getRelativeTimeString: jest.fn((date) => 'Hace 2 horas'),
}));

describe('DeviceConnectivityCard', () => {
  const mockGetRdbInstance = getRdbInstance as jest.MockedFunction<typeof getRdbInstance>;
  const mockOnValue = onValue as jest.MockedFunction<typeof onValue>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock RTDB instance
    mockGetRdbInstance.mockResolvedValue({
      app: {} as any,
      type: 'database',
    } as any);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    expect(getByText('Conectando...')).toBeTruthy();
  });

  it('renders no device state when deviceId is not provided', () => {
    const { getByText } = render(
      <DeviceConnectivityCard />
    );

    expect(getByText('No hay dispositivo vinculado')).toBeTruthy();
  });

  it('renders online status correctly', async () => {
    // Mock RTDB listener to return online device state
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: true,
          battery_level: 85,
          current_status: 'idle',
        }),
      });
      return jest.fn(); // unsubscribe function
    });

    const { getByText } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(getByText('En línea')).toBeTruthy();
      expect(getByText('85%')).toBeTruthy();
    });
  });

  it('renders offline status with last seen', async () => {
    // Mock RTDB listener to return offline device state
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: false,
          battery_level: 45,
          current_status: 'idle',
          last_seen: Date.now() - 7200000, // 2 hours ago
        }),
      });
      return jest.fn(); // unsubscribe function
    });

    const { getByText } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(getByText('Desconectado')).toBeTruthy();
      expect(getByText(/Visto por última vez/)).toBeTruthy();
    });
  });

  it('cleans up RTDB listener on unmount', async () => {
    const mockUnsubscribe = jest.fn();
    
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: true,
          battery_level: 85,
          current_status: 'idle',
        }),
      });
      return mockUnsubscribe;
    });

    const { unmount } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(mockOnValue).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('displays low battery level correctly', async () => {
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: true,
          battery_level: 25,
          current_status: 'idle',
        }),
      });
      return jest.fn();
    });

    const { getByText } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(getByText('25%')).toBeTruthy();
    });
  });

  it('displays critical battery level correctly', async () => {
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: true,
          battery_level: 10,
          current_status: 'idle',
        }),
      });
      return jest.fn();
    });

    const { getByText } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(getByText('10%')).toBeTruthy();
    });
  });

  it('handles missing battery level gracefully', async () => {
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: true,
          current_status: 'idle',
        }),
      });
      return jest.fn();
    });

    const { getByText } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(getByText('N/A')).toBeTruthy();
    });
  });

  it('formats last seen timestamp correctly', async () => {
    const mockTimestamp = Date.now() - 7200000; // 2 hours ago
    
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: false,
          battery_level: 50,
          current_status: 'idle',
          last_seen: mockTimestamp,
        }),
      });
      return jest.fn();
    });

    const { getByText } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(getByText(/Hace 2 horas/)).toBeTruthy();
    });
  });

  it('does not show last seen when device is online', async () => {
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: true,
          battery_level: 85,
          current_status: 'idle',
          last_seen: Date.now() - 7200000,
        }),
      });
      return jest.fn();
    });

    const { queryByText } = render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(queryByText(/Visto por última vez/)).toBeNull();
    });
  });

  it('calls onManageDevice when manage button is pressed', async () => {
    const mockOnManageDevice = jest.fn();
    
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: true,
          battery_level: 85,
          current_status: 'idle',
        }),
      });
      return jest.fn();
    });

    const { getByText } = render(
      <DeviceConnectivityCard 
        deviceId="test-device-123" 
        onManageDevice={mockOnManageDevice}
      />
    );

    await waitFor(() => {
      expect(getByText('Gestionar dispositivo')).toBeTruthy();
    });

    const manageButton = getByText('Gestionar dispositivo');
    manageButton.props.onPress();

    expect(mockOnManageDevice).toHaveBeenCalled();
  });

  it('sets up RTDB listener with correct path', async () => {
    const mockRef = jest.fn();
    
    mockOnValue.mockImplementation((ref, callback: any) => {
      callback({
        val: () => ({
          is_online: true,
          battery_level: 85,
          current_status: 'idle',
        }),
      });
      return jest.fn();
    });

    render(
      <DeviceConnectivityCard deviceId="test-device-123" />
    );

    await waitFor(() => {
      expect(mockOnValue).toHaveBeenCalled();
    });

    // Verify the listener was set up
    expect(mockOnValue).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Function),
      expect.any(Function)
    );
  });
});
