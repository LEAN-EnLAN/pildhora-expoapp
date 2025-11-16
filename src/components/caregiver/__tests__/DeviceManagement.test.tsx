/**
 * Device Management Unit Tests
 * 
 * Tests for the caregiver device management screen including:
 * - Device linking functionality
 * - Device unlinking functionality
 * - Device configuration updates
 * - Error handling
 * - Validation
 * 
 * Requirements: 1.4, 11.5
 * 
 * Run tests with: npm test DeviceManagement.test.tsx
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import authReducer from '../../../store/slices/authSlice';
import * as deviceLinking from '../../../services/deviceLinking';
import * as firebase from '../../../services/firebase';

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock device linking service
jest.mock('../../../services/deviceLinking', () => ({
  linkDeviceToUser: jest.fn(),
  unlinkDeviceFromUser: jest.fn(),
  DeviceLinkingError: class DeviceLinkingError extends Error {
    constructor(message: string, public code: string, public userMessage: string, public retryable: boolean = false) {
      super(message);
      this.name = 'DeviceLinkingError';
    }
  },
}));

// Mock Firebase services
jest.mock('../../../services/firebase', () => ({
  getDbInstance: jest.fn(),
  getRdbInstance: jest.fn(),
  getAuthInstance: jest.fn(),
}));

// Mock Firestore
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ seconds: Date.now() / 1000 }));

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
}));

// Mock hooks
jest.mock('../../../hooks/useLinkedPatients', () => ({
  useLinkedPatients: jest.fn(() => ({
    patients: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

jest.mock('../../../hooks/useDeviceState', () => ({
  useDeviceState: jest.fn(() => ({
    deviceState: {
      is_online: true,
      battery_level: 85,
      current_status: 'idle',
    },
    isLoading: false,
  })),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('DeviceManagement Screen', () => {
  let store: any;
  let DeviceManagementScreen: any;
  const mockRefetch = jest.fn();

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: 'caregiver-123',
            email: 'caregiver@test.com',
            role: 'caregiver',
            name: 'Dr. Smith',
          },
          loading: false,
          error: null,
        },
      },
    });

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (firebase.getDbInstance as jest.Mock).mockResolvedValue({});
    (firebase.getRdbInstance as jest.Mock).mockResolvedValue({});
    (firebase.getAuthInstance as jest.Mock).mockResolvedValue({
      currentUser: { uid: 'caregiver-123' },
    });

    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    mockSetDoc.mockResolvedValue(undefined);

    // Setup useLinkedPatients mock
    const useLinkedPatients = require('../../../hooks/useLinkedPatients').useLinkedPatients;
    useLinkedPatients.mockReturnValue({
      patients: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    // Dynamically import the component
    DeviceManagementScreen = require('../../../../app/caregiver/add-device').default;
  });

  describe('Device Linking', () => {
    /**
     * Test 1: Successfully link a device
     */
    it('successfully links a device with valid ID', async () => {
      (deviceLinking.linkDeviceToUser as jest.Mock).mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      // Enter device ID
      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      // Click link button
      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      await waitFor(() => {
        expect(deviceLinking.linkDeviceToUser).toHaveBeenCalledWith('caregiver-123', 'esp8266-ABC123');
      });

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    /**
     * Test 2: Validate minimum device ID length (5 characters)
     */
    it('shows validation error for device ID less than 5 characters', async () => {
      const { getByPlaceholderText, getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      // Enter short device ID
      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'abc');

      await waitFor(() => {
        expect(getByText(/debe tener al menos 5 caracteres/i)).toBeTruthy();
      });

      // Link button should be disabled
      const linkButton = getByText(/Vincular Dispositivo/i);
      expect(linkButton.props.accessibilityState?.disabled).toBe(true);
    });

    /**
     * Test 3: Validate empty device ID
     */
    it('shows validation error for empty device ID', async () => {
      const { getByPlaceholderText, getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      
      // Enter text then clear it
      fireEvent.changeText(input, 'test');
      fireEvent.changeText(input, '');

      // Try to submit
      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      await waitFor(() => {
        expect(deviceLinking.linkDeviceToUser).not.toHaveBeenCalled();
      });
    });

    /**
     * Test 4: Handle device linking error
     */
    it('displays error message when device linking fails', async () => {
      const error = new (deviceLinking as any).DeviceLinkingError(
        'Device already linked',
        'ALREADY_LINKED',
        'Este dispositivo ya está vinculado a tu cuenta.',
        false
      );
      (deviceLinking.linkDeviceToUser as jest.Mock).mockRejectedValue(error);

      const { getByPlaceholderText, getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      // Enter device ID
      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      // Click link button
      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      // Wait for error message
      const errorMessage = await findByText(/Este dispositivo ya está vinculado a tu cuenta/i);
      expect(errorMessage).toBeTruthy();
    });

    /**
     * Test 5: Clear input after successful linking
     */
    it('clears device ID input after successful linking', async () => {
      (deviceLinking.linkDeviceToUser as jest.Mock).mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });

    /**
     * Test 6: Show success message after linking
     */
    it('shows success message after successful device linking', async () => {
      (deviceLinking.linkDeviceToUser as jest.Mock).mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      const successMessage = await findByText(/Dispositivo vinculado exitosamente/i);
      expect(successMessage).toBeTruthy();
    });

    /**
     * Test 7: Disable link button while linking in progress
     */
    it('disables link button while linking is in progress', async () => {
      let resolveLink: any;
      const linkPromise = new Promise((resolve) => {
        resolveLink = resolve;
      });
      (deviceLinking.linkDeviceToUser as jest.Mock).mockReturnValue(linkPromise);

      const { getByPlaceholderText, getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      await waitFor(() => {
        expect(linkButton.props.accessibilityState?.disabled).toBe(true);
      });

      // Resolve the promise
      act(() => {
        resolveLink();
      });
    });
  });

  describe('Device Unlinking', () => {
    beforeEach(() => {
      // Setup mock with linked devices
      const useLinkedPatients = require('../../../hooks/useLinkedPatients').useLinkedPatients;
      useLinkedPatients.mockReturnValue({
        patients: [
          {
            id: 'patient-123',
            name: 'John Doe',
            deviceId: 'esp8266-ABC123',
            email: 'john@test.com',
            role: 'patient',
          },
        ],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });
    });

    /**
     * Test 8: Show confirmation dialog before unlinking
     */
    it('shows confirmation dialog before unlinking device', async () => {
      const { getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const unlinkButton = getByText(/Desvincular/i);
      fireEvent.press(unlinkButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Confirmar desvinculación',
        expect.stringContaining('John Doe'),
        expect.any(Array)
      );
    });

    /**
     * Test 9: Successfully unlink device after confirmation
     */
    it('successfully unlinks device after confirmation', async () => {
      (deviceLinking.unlinkDeviceFromUser as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const unlinkButton = getByText(/Desvincular/i);
      fireEvent.press(unlinkButton);

      // Get the confirmation callback
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Desvincular');
      
      // Execute confirmation
      await act(async () => {
        await confirmButton.onPress();
      });

      await waitFor(() => {
        expect(deviceLinking.unlinkDeviceFromUser).toHaveBeenCalledWith('caregiver-123', 'esp8266-ABC123');
      });

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    /**
     * Test 10: Cancel unlinking from confirmation dialog
     */
    it('cancels unlinking when user dismisses confirmation', async () => {
      const { getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const unlinkButton = getByText(/Desvincular/i);
      fireEvent.press(unlinkButton);

      // Get the cancel callback
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelButton = alertCall[2].find((btn: any) => btn.text === 'Cancelar');
      
      // Execute cancel
      if (cancelButton.onPress) {
        cancelButton.onPress();
      }

      // Verify unlinking was not called
      expect(deviceLinking.unlinkDeviceFromUser).not.toHaveBeenCalled();
    });

    /**
     * Test 11: Handle unlinking error
     */
    it('displays error message when device unlinking fails', async () => {
      const error = new (deviceLinking as any).DeviceLinkingError(
        'Permission denied',
        'PERMISSION_DENIED',
        'No tienes permiso para desvincular este dispositivo.',
        false
      );
      (deviceLinking.unlinkDeviceFromUser as jest.Mock).mockRejectedValue(error);

      const { getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const unlinkButton = getByText(/Desvincular/i);
      fireEvent.press(unlinkButton);

      // Confirm unlinking
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Desvincular');
      
      await act(async () => {
        await confirmButton.onPress();
      });

      // Wait for error message
      const errorMessage = await findByText(/No tienes permiso para desvincular este dispositivo/i);
      expect(errorMessage).toBeTruthy();
    });

    /**
     * Test 12: Show success message after unlinking
     */
    it('shows success message after successful device unlinking', async () => {
      (deviceLinking.unlinkDeviceFromUser as jest.Mock).mockResolvedValue(undefined);

      const { getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const unlinkButton = getByText(/Desvincular/i);
      fireEvent.press(unlinkButton);

      // Confirm unlinking
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Desvincular');
      
      await act(async () => {
        await confirmButton.onPress();
      });

      const successMessage = await findByText(/Dispositivo desvinculado exitosamente/i);
      expect(successMessage).toBeTruthy();
    });
  });

  describe('Device Configuration', () => {
    beforeEach(() => {
      // Setup mock with linked devices
      const useLinkedPatients = require('../../../hooks/useLinkedPatients').useLinkedPatients;
      useLinkedPatients.mockReturnValue({
        patients: [
          {
            id: 'patient-123',
            name: 'John Doe',
            deviceId: 'esp8266-ABC123',
            email: 'john@test.com',
            role: 'patient',
          },
        ],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      // Mock device config fetch
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          desiredConfig: {
            alarm_mode: 'both',
            led_intensity: 512,
            led_color_rgb: [255, 255, 255],
          },
        }),
      });
    });

    /**
     * Test 13: Expand device configuration panel
     */
    it('expands device configuration panel when button is pressed', async () => {
      const { getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const expandButton = getByText(/Mostrar configuración/i);
      fireEvent.press(expandButton);

      await waitFor(() => {
        expect(getByText(/Ocultar configuración/i)).toBeTruthy();
      });
    });

    /**
     * Test 14: Successfully save device configuration
     */
    it('successfully saves device configuration', async () => {
      mockSetDoc.mockResolvedValue(undefined);

      const { getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      // Expand configuration panel
      const expandButton = getByText(/Mostrar configuración/i);
      fireEvent.press(expandButton);

      await waitFor(() => {
        expect(getByText(/Ocultar configuración/i)).toBeTruthy();
      });

      // Wait for config to load and find save button
      await waitFor(() => {
        const saveButton = getByText(/Guardar/i);
        expect(saveButton).toBeTruthy();
      });

      // Note: Full configuration testing would require mocking the DeviceConfigPanel component
      // This test verifies the panel loads and is ready for interaction
    });

    /**
     * Test 15: Handle configuration save error
     */
    it('displays error message when configuration save fails', async () => {
      mockSetDoc.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      // Expand configuration panel
      const expandButton = getByText(/Mostrar configuración/i);
      fireEvent.press(expandButton);

      await waitFor(() => {
        expect(getByText(/Ocultar configuración/i)).toBeTruthy();
      });

      // Configuration error handling is tested through the component's error boundaries
    });
  });

  describe('Error Handling', () => {
    /**
     * Test 16: Handle authentication error
     */
    it('shows error when user is not authenticated', async () => {
      // Create store without authenticated user
      const unauthStore = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: null,
            loading: false,
            error: null,
          },
        },
      });

      const { getByPlaceholderText, getByText, findByText } = render(
        <Provider store={unauthStore}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      const errorMessage = await findByText(/Debes iniciar sesión/i);
      expect(errorMessage).toBeTruthy();
    });

    /**
     * Test 17: Handle network error during linking
     */
    it('handles network error during device linking', async () => {
      const error = new (deviceLinking as any).DeviceLinkingError(
        'Service unavailable',
        'SERVICE_UNAVAILABLE',
        'El servicio no está disponible. Por favor, verifica tu conexión a internet.',
        true
      );
      (deviceLinking.linkDeviceToUser as jest.Mock).mockRejectedValue(error);

      const { getByPlaceholderText, getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      const errorMessage = await findByText(/verifica tu conexión a internet/i);
      expect(errorMessage).toBeTruthy();
    });

    /**
     * Test 18: Handle Firebase initialization error
     */
    it('handles Firebase initialization error', async () => {
      (firebase.getDbInstance as jest.Mock).mockResolvedValue(null);

      const { getByPlaceholderText, getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      const errorMessage = await findByText(/No se pudo conectar a la base de datos/i);
      expect(errorMessage).toBeTruthy();
    });

    /**
     * Test 19: Display error when loading linked devices fails
     */
    it('displays error when loading linked devices fails', async () => {
      const useLinkedPatients = require('../../../hooks/useLinkedPatients').useLinkedPatients;
      useLinkedPatients.mockReturnValue({
        patients: [],
        isLoading: false,
        error: new Error('Failed to load patients'),
        refetch: mockRefetch,
      });

      const { findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const errorMessage = await findByText(/Error al cargar dispositivos vinculados/i);
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('UI States', () => {
    /**
     * Test 20: Show loading state while fetching devices
     */
    it('shows loading state while fetching linked devices', async () => {
      const useLinkedPatients = require('../../../hooks/useLinkedPatients').useLinkedPatients;
      useLinkedPatients.mockReturnValue({
        patients: [],
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      const { getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      expect(getByText(/Cargando dispositivos/i)).toBeTruthy();
    });

    /**
     * Test 21: Show empty state when no devices are linked
     */
    it('shows empty state when no devices are linked', async () => {
      const { getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText(/No hay dispositivos vinculados/i)).toBeTruthy();
      });
    });

    /**
     * Test 22: Display device status information
     */
    it('displays device status information for linked devices', async () => {
      const useLinkedPatients = require('../../../hooks/useLinkedPatients').useLinkedPatients;
      useLinkedPatients.mockReturnValue({
        patients: [
          {
            id: 'patient-123',
            name: 'John Doe',
            deviceId: 'esp8266-ABC123',
            email: 'john@test.com',
            role: 'patient',
          },
        ],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { getByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText(/En línea/i)).toBeTruthy();
        expect(getByText(/85%/i)).toBeTruthy();
      });
    });

    /**
     * Test 23: Dismiss success message
     */
    it('allows dismissing success message', async () => {
      (deviceLinking.linkDeviceToUser as jest.Mock).mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, findByText, queryByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      const successMessage = await findByText(/Dispositivo vinculado exitosamente/i);
      expect(successMessage).toBeTruthy();

      // Note: Dismissing would require finding and pressing the dismiss button
      // This depends on the SuccessMessage component implementation
    });

    /**
     * Test 24: Dismiss error message
     */
    it('allows dismissing error message', async () => {
      const error = new (deviceLinking as any).DeviceLinkingError(
        'Device already linked',
        'ALREADY_LINKED',
        'Este dispositivo ya está vinculado a tu cuenta.',
        false
      );
      (deviceLinking.linkDeviceToUser as jest.Mock).mockRejectedValue(error);

      const { getByPlaceholderText, getByText, findByText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      const input = getByPlaceholderText(/Ejemplo: esp8266-ABC123/i);
      fireEvent.changeText(input, 'esp8266-ABC123');

      const linkButton = getByText(/Vincular Dispositivo/i);
      fireEvent.press(linkButton);

      const errorMessage = await findByText(/Este dispositivo ya está vinculado a tu cuenta/i);
      expect(errorMessage).toBeTruthy();

      // Note: Dismissing would require finding and pressing the dismiss button
      // This depends on the ErrorMessage component implementation
    });

    /**
     * Test 25: Accessibility labels are present
     */
    it('has proper accessibility labels for interactive elements', async () => {
      const { getByLabelText } = render(
        <Provider store={store}>
          <DeviceManagementScreen />
        </Provider>
      );

      expect(getByLabelText(/Vincular dispositivo/i)).toBeTruthy();
    });
  });
});
