import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { TestTopoButton } from '../TestTopoButton';
import * as firebaseService from '../../../services/firebase';

// Mock Firebase Realtime Database
const mockSet = jest.fn();
const mockOnValue = jest.fn();
const mockOff = jest.fn();
const mockRef = jest.fn();

jest.mock('firebase/database', () => ({
  ref: (...args: any[]) => mockRef(...args),
  set: (...args: any[]) => mockSet(...args),
  onValue: (...args: any[]) => mockOnValue(...args),
  off: (...args: any[]) => mockOff(...args),
}));

// Mock Firebase Service
jest.mock('../../../services/firebase', () => ({
  getRdbInstance: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('TestTopoButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (firebaseService.getRdbInstance as jest.Mock).mockResolvedValue({ dummy: 'db' });
  });

  it('renders correctly', () => {
    const { getByText } = render(<TestTopoButton />);
    expect(getByText('Prueba TOPO')).toBeTruthy();
    expect(getByText('TEST-DEVICE-001')).toBeTruthy();
  });

  it('handles button press and sends signal', async () => {
    mockSet.mockResolvedValueOnce(undefined);
    const { getByRole } = render(<TestTopoButton />);
    
    const button = getByRole('button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(firebaseService.getRdbInstance).toHaveBeenCalled();
      expect(mockRef).toHaveBeenCalledWith(expect.anything(), 'devices/TEST-DEVICE-001/commands/topo');
      expect(mockSet).toHaveBeenCalledWith(expect.anything(), true);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Éxito',
        expect.stringContaining('Se ha enviado la señal TOPO')
      );
    });
  });

  it('displays error alert on failure', async () => {
    const error = new Error('Network error');
    mockSet.mockRejectedValueOnce(error);
    const { getByRole } = render(<TestTopoButton />);
    
    const button = getByRole('button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error');
    });
  });

  it('updates state based on firebase value', async () => {
    // Mock onValue to trigger the callback immediately
    mockOnValue.mockImplementation((ref, callback) => {
      callback({ val: () => true });
    });

    const { getByText } = render(<TestTopoButton />);

    await waitFor(() => {
      expect(getByText('ACTIVO')).toBeTruthy();
    });
  });
});
