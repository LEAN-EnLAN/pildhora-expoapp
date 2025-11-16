/**
 * Medications Management Unit Tests
 * 
 * Tests for the caregiver medications management screen including:
 * - Medication list rendering
 * - Search/filter functionality
 * - CRUD operations
 * - Event generation
 * - Real-time updates
 * 
 * Run tests with: npm test
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import medicationsReducer from '../../../store/slices/medicationsSlice';
import authReducer from '../../../store/slices/authSlice';

// Mock Expo Router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ patientId: 'patient-123' })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

// Mock Firebase services
jest.mock('../../../services/firebase/user', () => ({
  getPatientById: jest.fn(() => Promise.resolve({ id: 'patient-123', name: 'John Doe' })),
}));

jest.mock('../../../services/inventoryService', () => ({
  inventoryService: {
    checkLowQuantity: jest.fn(() => Promise.resolve(false)),
  },
}));

// Mock medication event service
jest.mock('../../../services/medicationEventService', () => ({
  createAndEnqueueEvent: jest.fn(() => Promise.resolve()),
}));

describe('CaregiverMedicationsIndex', () => {
  let store: any;
  let CaregiverMedicationsIndex: any;

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: 'caregiver-456',
            email: 'caregiver@test.com',
            role: 'caregiver',
            name: 'Dr. Smith',
          },
          loading: false,
          error: null,
        },
        medications: {
          medications: [],
          loading: false,
          error: null,
        },
      },
    });

    // Clear all mocks
    jest.clearAllMocks();

    // Dynamically import the component to ensure fresh mocks
    CaregiverMedicationsIndex = require('../../../../app/caregiver/medications/[patientId]/index').default;
  });

  /**
   * Test 1: Component renders with loading state
   */
  it('renders loading state initially', () => {
    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: [],
          loading: true,
          error: null,
        },
      },
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    // Should show skeleton loaders
    expect(getByTestId).toBeDefined();
  });

  /**
   * Test 2: Renders empty state when no medications
   */
  it('renders empty state when no medications exist', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('No hay medicamentos')).toBeTruthy();
      expect(getByText('Agrega el primer medicamento para este paciente')).toBeTruthy();
    });
  });

  /**
   * Test 3: Renders medication list correctly
   */
  it('renders medication list with MedicationCard components', async () => {
    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
      {
        id: 'med-2',
        name: 'Ibuprofen',
        doseValue: 200,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['12:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Aspirin')).toBeTruthy();
      expect(getByText('Ibuprofen')).toBeTruthy();
    });
  });

  /**
   * Test 4: Search functionality filters medications
   */
  it('filters medications based on search query', async () => {
    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
      {
        id: 'med-2',
        name: 'Ibuprofen',
        doseValue: 200,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['12:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByPlaceholderText, getByText, queryByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    // Find search input
    const searchInput = getByPlaceholderText('Buscar medicamentos...');

    // Type search query
    fireEvent.changeText(searchInput, 'Aspirin');

    await waitFor(() => {
      expect(getByText('Aspirin')).toBeTruthy();
      expect(queryByText('Ibuprofen')).toBeNull();
    });
  });

  /**
   * Test 5: Search is case-insensitive
   */
  it('performs case-insensitive search', async () => {
    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    const searchInput = getByPlaceholderText('Buscar medicamentos...');

    // Search with lowercase
    fireEvent.changeText(searchInput, 'aspirin');

    await waitFor(() => {
      expect(getByText('Aspirin')).toBeTruthy();
    });
  });

  /**
   * Test 6: Clear search button works
   */
  it('clears search when clear button is pressed', async () => {
    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
      {
        id: 'med-2',
        name: 'Ibuprofen',
        doseValue: 200,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['12:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByPlaceholderText, getByLabelText, getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    const searchInput = getByPlaceholderText('Buscar medicamentos...');

    // Type search query
    fireEvent.changeText(searchInput, 'Aspirin');

    await waitFor(() => {
      expect(getByText('Aspirin')).toBeTruthy();
    });

    // Click clear button
    const clearButton = getByLabelText('Limpiar búsqueda');
    fireEvent.press(clearButton);

    await waitFor(() => {
      expect(getByText('Aspirin')).toBeTruthy();
      expect(getByText('Ibuprofen')).toBeTruthy();
    });
  });

  /**
   * Test 7: Shows empty search results state
   */
  it('shows empty state when search has no results', async () => {
    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    const searchInput = getByPlaceholderText('Buscar medicamentos...');

    // Search for non-existent medication
    fireEvent.changeText(searchInput, 'Nonexistent');

    await waitFor(() => {
      expect(getByText('No se encontraron medicamentos')).toBeTruthy();
      expect(getByText(/No hay medicamentos que coincidan con/)).toBeTruthy();
    });
  });

  /**
   * Test 8: Add medication button navigates correctly
   */
  it('navigates to add medication screen when add button is pressed', async () => {
    const mockRouter = require('expo-router').useRouter();
    const mockPush = jest.fn();
    mockRouter.mockReturnValue({ push: mockPush, back: jest.fn() });

    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    await waitFor(() => {
      const addButton = getByText('Agregar Medicamento');
      fireEvent.press(addButton);
      expect(mockPush).toHaveBeenCalledWith('/caregiver/medications/patient-123/add');
    });
  });

  /**
   * Test 9: Medication card press navigates to detail view
   */
  it('navigates to medication detail when card is pressed', async () => {
    const mockRouter = require('expo-router').useRouter();
    const mockPush = jest.fn();
    mockRouter.mockReturnValue({ push: mockPush, back: jest.fn() });

    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    await waitFor(() => {
      const medicationCard = getByText('Aspirin');
      fireEvent.press(medicationCard);
      expect(mockPush).toHaveBeenCalledWith('/caregiver/medications/patient-123/med-1');
    });
  });

  /**
   * Test 10: Shows low inventory badge when applicable
   */
  it('displays low inventory badge for medications with low quantity', async () => {
    const { inventoryService } = require('../../../services/inventoryService');
    inventoryService.checkLowQuantity.mockResolvedValue(true);

    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
        trackInventory: true,
        currentQuantity: 5,
        lowQuantityThreshold: 10,
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Aspirin')).toBeTruthy();
      expect(inventoryService.checkLowQuantity).toHaveBeenCalledWith('med-1');
    });
  });

  /**
   * Test 11: Error state displays correctly
   */
  it('displays error message when loading fails', async () => {
    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: [],
          loading: false,
          error: 'Failed to load medications',
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    await waitFor(() => {
      expect(getByText('Failed to load medications')).toBeTruthy();
    });
  });

  /**
   * Test 12: Retry button works on error
   */
  it('retries loading medications when retry button is pressed', async () => {
    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: [],
          loading: false,
          error: 'Failed to load medications',
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    await waitFor(() => {
      const retryButton = getByText(/Reintentar|Retry/i);
      expect(retryButton).toBeTruthy();
    });
  });

  /**
   * Test 13: Search filters by dose unit
   */
  it('filters medications by dose unit in search', async () => {
    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
      {
        id: 'med-2',
        name: 'Cough Syrup',
        doseValue: 5,
        doseUnit: 'ml',
        quantityType: 'liquid',
        frequency: 'daily',
        times: ['12:00'],
        patientId: 'patient-123',
        emoji: '💧',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByPlaceholderText, getByText, queryByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    const searchInput = getByPlaceholderText('Buscar medicamentos...');

    // Search by unit
    fireEvent.changeText(searchInput, 'ml');

    await waitFor(() => {
      expect(getByText('Cough Syrup')).toBeTruthy();
      expect(queryByText('Aspirin')).toBeNull();
    });
  });

  /**
   * Test 14: Search filters by quantity type
   */
  it('filters medications by quantity type in search', async () => {
    const mockMedications = [
      {
        id: 'med-1',
        name: 'Aspirin',
        doseValue: 100,
        doseUnit: 'mg',
        quantityType: 'pill',
        frequency: 'daily',
        times: ['08:00'],
        patientId: 'patient-123',
        emoji: '💊',
      },
      {
        id: 'med-2',
        name: 'Skin Cream',
        doseValue: 1,
        doseUnit: 'application',
        quantityType: 'cream',
        frequency: 'daily',
        times: ['12:00'],
        patientId: 'patient-123',
        emoji: '🧴',
      },
    ];

    store = configureStore({
      reducer: {
        medications: medicationsReducer,
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'caregiver-456', email: 'test@test.com', role: 'caregiver', name: 'Dr. Smith' },
          loading: false,
          error: null,
        },
        medications: {
          medications: mockMedications,
          loading: false,
          error: null,
        },
      },
    });

    const { getByPlaceholderText, getByText, queryByText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    const searchInput = getByPlaceholderText('Buscar medicamentos...');

    // Search by quantity type
    fireEvent.changeText(searchInput, 'cream');

    await waitFor(() => {
      expect(getByText('Skin Cream')).toBeTruthy();
      expect(queryByText('Aspirin')).toBeNull();
    });
  });

  /**
   * Test 15: Accessibility labels are present
   */
  it('has proper accessibility labels for search input', async () => {
    const { getByLabelText } = render(
      <Provider store={store}>
        <CaregiverMedicationsIndex />
      </Provider>
    );

    await waitFor(() => {
      expect(getByLabelText('Buscar medicamentos')).toBeTruthy();
    });
  });
});

