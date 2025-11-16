/**
 * EventFilterControls Unit Tests
 * 
 * Tests for the EventFilterControls component including:
 * - Filter controls rendering
 * - Filter state updates
 * - Filter persistence to AsyncStorage
 * 
 * Run tests with: npm test
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventFilterControls, EventFilters } from '../EventFilterControls';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('EventFilterControls', () => {
  const mockOnFiltersChange = jest.fn();
  const mockPatients = [
    { id: 'patient-1', name: 'John Doe' },
    { id: 'patient-2', name: 'Jane Smith' },
    { id: 'patient-3', name: 'Bob Johnson' },
  ];

  const defaultProps = {
    filters: {} as EventFilters,
    onFiltersChange: mockOnFiltersChange,
    patients: mockPatients,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  /**
   * Test 1: Component renders correctly
   */
  it('renders the filter controls with search input', () => {
    const { getByPlaceholderText } = render(
      <EventFilterControls {...defaultProps} />
    );

    expect(getByPlaceholderText('Buscar por medicamento...')).toBeTruthy();
  });

  /**
   * Test 2: All filter chips are rendered
   */
  it('renders all filter chips', () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    expect(getByText('Todos los pacientes')).toBeTruthy();
    expect(getByText('Todos los eventos')).toBeTruthy();
    expect(getByText('Todo el tiempo')).toBeTruthy();
  });

  /**
   * Test 3: Search input updates filter state
   */
  it('updates search query when text is entered', () => {
    const { getByPlaceholderText } = render(
      <EventFilterControls {...defaultProps} />
    );

    const searchInput = getByPlaceholderText('Buscar por medicamento...');
    fireEvent.changeText(searchInput, 'Aspirin');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchQuery: 'Aspirin',
    });
  });

  /**
   * Test 4: Search clear button works
   */
  it('clears search query when clear button is pressed', () => {
    const { getByPlaceholderText, UNSAFE_getByType } = render(
      <EventFilterControls
        {...defaultProps}
        filters={{ searchQuery: 'Aspirin' }}
      />
    );

    const searchInput = getByPlaceholderText('Buscar por medicamento...');
    expect(searchInput.props.value).toBe('Aspirin');

    // Clear the search
    fireEvent.changeText(searchInput, '');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchQuery: undefined,
    });
  });

  /**
   * Test 5: Patient filter modal opens
   */
  it('opens patient filter modal when patient chip is pressed', async () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    const patientChip = getByText('Todos los pacientes');
    fireEvent.press(patientChip);

    await waitFor(() => {
      expect(getByText('Filtrar por paciente')).toBeTruthy();
    });
  });

  /**
   * Test 6: Patient selection updates filter
   */
  it('updates patient filter when patient is selected', async () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    // Open modal
    const patientChip = getByText('Todos los pacientes');
    fireEvent.press(patientChip);

    await waitFor(() => {
      expect(getByText('Filtrar por paciente')).toBeTruthy();
    });

    // Select a patient
    const patientOption = getByText('John Doe');
    fireEvent.press(patientOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      patientId: 'patient-1',
    });
  });

  /**
   * Test 7: Event type filter modal opens
   */
  it('opens event type filter modal when event type chip is pressed', async () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    const eventTypeChip = getByText('Todos los eventos');
    fireEvent.press(eventTypeChip);

    await waitFor(() => {
      expect(getByText('Filtrar por tipo de evento')).toBeTruthy();
    });
  });

  /**
   * Test 8: Event type selection updates filter
   */
  it('updates event type filter when type is selected', async () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    // Open modal
    const eventTypeChip = getByText('Todos los eventos');
    fireEvent.press(eventTypeChip);

    await waitFor(() => {
      expect(getByText('Filtrar por tipo de evento')).toBeTruthy();
    });

    // Select event type
    const createdOption = getByText('Creados');
    fireEvent.press(createdOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      eventType: 'created',
    });
  });

  /**
   * Test 9: Date range filter modal opens
   */
  it('opens date range filter modal when date chip is pressed', async () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    const dateChip = getByText('Todo el tiempo');
    fireEvent.press(dateChip);

    await waitFor(() => {
      expect(getByText('Filtrar por fecha')).toBeTruthy();
    });
  });

  /**
   * Test 10: Date range preset selection updates filter
   */
  it('updates date range filter when preset is selected', async () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    // Open modal
    const dateChip = getByText('Todo el tiempo');
    fireEvent.press(dateChip);

    await waitFor(() => {
      expect(getByText('Filtrar por fecha')).toBeTruthy();
    });

    // Select "Hoy" preset
    const todayOption = getByText('Hoy');
    fireEvent.press(todayOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dateRange: expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        }),
      })
    );
  });

  /**
   * Test 11: Clear filters button appears when filters are active
   */
  it('shows clear filters button when filters are active', () => {
    const { getByText } = render(
      <EventFilterControls
        {...defaultProps}
        filters={{ patientId: 'patient-1' }}
      />
    );

    expect(getByText('Limpiar')).toBeTruthy();
  });

  /**
   * Test 12: Clear filters button clears all filters
   */
  it('clears all filters when clear button is pressed', () => {
    const { getByText } = render(
      <EventFilterControls
        {...defaultProps}
        filters={{
          patientId: 'patient-1',
          eventType: 'created',
          searchQuery: 'Aspirin',
        }}
      />
    );

    const clearButton = getByText('Limpiar');
    fireEvent.press(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  /**
   * Test 13: Filter persistence - saves to AsyncStorage
   */
  it('saves filters to AsyncStorage when filters change', async () => {
    const filters: EventFilters = {
      patientId: 'patient-1',
      eventType: 'created',
    };

    render(
      <EventFilterControls
        {...defaultProps}
        filters={filters}
      />
    );

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@medication_event_filters',
        JSON.stringify(filters)
      );
    });
  });

  /**
   * Test 14: Filter persistence - loads from AsyncStorage
   */
  it('loads filters from AsyncStorage on mount', async () => {
    const savedFilters: EventFilters = {
      patientId: 'patient-2',
      eventType: 'updated',
      searchQuery: 'Ibuprofen',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(savedFilters)
    );

    render(<EventFilterControls {...defaultProps} />);

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@medication_event_filters'
      );
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-2',
          eventType: 'updated',
          searchQuery: 'Ibuprofen',
        })
      );
    });
  });

  /**
   * Test 15: Filter persistence - handles date range conversion
   */
  it('converts date strings back to Date objects when loading from AsyncStorage', async () => {
    const savedFilters = {
      dateRange: {
        start: new Date('2024-01-01').toISOString(),
        end: new Date('2024-01-31').toISOString(),
      },
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(savedFilters)
    );

    render(<EventFilterControls {...defaultProps} />);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({
            start: expect.any(Date),
            end: expect.any(Date),
          }),
        })
      );
    });
  });

  /**
   * Test 16: Patient name display
   */
  it('displays selected patient name correctly', () => {
    const { getByText } = render(
      <EventFilterControls
        {...defaultProps}
        filters={{ patientId: 'patient-2' }}
      />
    );

    expect(getByText('Jane Smith')).toBeTruthy();
  });

  /**
   * Test 17: Event type label display
   */
  it('displays selected event type label correctly', () => {
    const { getByText } = render(
      <EventFilterControls
        {...defaultProps}
        filters={{ eventType: 'updated' }}
      />
    );

    expect(getByText('Actualizados')).toBeTruthy();
  });

  /**
   * Test 18: Date range label display
   */
  it('displays date range label correctly', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');

    const { getByText } = render(
      <EventFilterControls
        {...defaultProps}
        filters={{ dateRange: { start, end } }}
      />
    );

    // Check that some date text is displayed (format may vary by locale)
    const dateText = getByText(/ene|jan/i);
    expect(dateText).toBeTruthy();
  });

  /**
   * Test 19: Modal closes when close button is pressed
   */
  it('closes patient modal when close button is pressed', async () => {
    const { getByText, queryByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    // Open modal
    const patientChip = getByText('Todos los pacientes');
    fireEvent.press(patientChip);

    await waitFor(() => {
      expect(getByText('Filtrar por paciente')).toBeTruthy();
    });

    // Close modal
    const closeButton = getByText('Cerrar');
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(queryByText('Filtrar por paciente')).toBeNull();
    });
  });

  /**
   * Test 20: Multiple filters can be active simultaneously
   */
  it('handles multiple active filters correctly', () => {
    const filters: EventFilters = {
      patientId: 'patient-1',
      eventType: 'deleted',
      searchQuery: 'Medication',
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    };

    const { getByText } = render(
      <EventFilterControls
        {...defaultProps}
        filters={filters}
      />
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Eliminados')).toBeTruthy();
    expect(getByText('Limpiar')).toBeTruthy();
  });

  /**
   * Test 21: Empty search query is treated as undefined
   */
  it('treats empty search query as undefined', () => {
    const { getByPlaceholderText } = render(
      <EventFilterControls {...defaultProps} />
    );

    const searchInput = getByPlaceholderText('Buscar por medicamento...');
    
    // Enter text
    fireEvent.changeText(searchInput, 'Test');
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchQuery: 'Test',
    });

    // Clear text
    mockOnFiltersChange.mockClear();
    fireEvent.changeText(searchInput, '');
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchQuery: undefined,
    });
  });

  /**
   * Test 22: All event types are available in modal
   */
  it('displays all event type options in modal', async () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    // Open modal
    const eventTypeChip = getByText('Todos los eventos');
    fireEvent.press(eventTypeChip);

    await waitFor(() => {
      expect(getByText('Creados')).toBeTruthy();
      expect(getByText('Actualizados')).toBeTruthy();
      expect(getByText('Eliminados')).toBeTruthy();
    });
  });

  /**
   * Test 23: All date presets are available in modal
   */
  it('displays all date preset options in modal', async () => {
    const { getByText } = render(
      <EventFilterControls {...defaultProps} />
    );

    // Open modal
    const dateChip = getByText('Todo el tiempo');
    fireEvent.press(dateChip);

    await waitFor(() => {
      expect(getByText('Hoy')).toBeTruthy();
      expect(getByText('Últimos 7 días')).toBeTruthy();
      expect(getByText('Este mes')).toBeTruthy();
    });
  });

  /**
   * Test 24: Selecting "all" date range clears date filter
   */
  it('clears date range when "all" is selected', async () => {
    const { getByText } = render(
      <EventFilterControls
        {...defaultProps}
        filters={{
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
        }}
      />
    );

    // Open modal
    const dateChip = getByText(/ene|jan/i);
    fireEvent.press(dateChip);

    await waitFor(() => {
      expect(getByText('Todo el tiempo')).toBeTruthy();
    });

    // Select "all"
    const allOption = getByText('Todo el tiempo');
    fireEvent.press(allOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateRange: undefined,
    });
  });

  /**
   * Test 25: Error handling for AsyncStorage failures
   */
  it('handles AsyncStorage errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
      new Error('Storage error')
    );

    render(<EventFilterControls {...defaultProps} />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error loading filters'),
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });
});
