import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DayDetail } from '../DayDetail';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

describe('DayDetail', () => {
  const mockDate = new Date('2023-10-15T12:00:00Z');
  const mockOnEventPress = jest.fn();
  
  const mockEvents = [
    {
      id: '1',
      medicationName: 'Paracetamol',
      scheduledTime: new Date('2023-10-15T09:00:00Z').toISOString(),
      status: 'taken',
      timestamp: new Date('2023-10-15T09:05:00Z').toISOString(),
      patientId: 'p1',
      medicationId: 'm1',
      deviceId: 'd1'
    },
    {
      id: '2',
      medicationName: 'Ibuprofeno',
      scheduledTime: new Date('2023-10-15T14:00:00Z').toISOString(),
      status: 'missed',
      timestamp: new Date('2023-10-15T14:00:00Z').toISOString(),
      patientId: 'p1',
      medicationId: 'm2',
      deviceId: 'd1'
    }
  ];

  const mockStats = {
    taken: 1,
    missed: 1,
    skipped: 0,
    total: 2
  };

  it('renders correctly with events', () => {
    const { getByText, getByTestId } = render(
      <DayDetail
        date={mockDate}
        events={mockEvents as any}
        stats={mockStats}
        loading={false}
        onEventPress={mockOnEventPress}
      />
    );

    // Check date header
    expect(getByText(format(mockDate, "EEEE, d 'de' MMMM", { locale: es }))).toBeTruthy();
    
    // Check stats
    expect(getByText('Tomadas')).toBeTruthy();
    expect(getByTestId('stats-taken')).toHaveTextContent('1');
    expect(getByText('Olvidadas')).toBeTruthy();
    expect(getByTestId('stats-missed')).toHaveTextContent('1');
    
    // Check event list content (assuming MedicationEventCard renders medicationName)
    // We need to check if MedicationEventCard is rendered.
    // Since we are not mocking MedicationEventCard, it should render its children.
    // If MedicationEventCard is complex, we might want to mock it.
    // But for integration test of DayDetail, let's see if we can find text.
  });

  it('renders loading state', () => {
    const { getByText } = render(
      <DayDetail
        date={mockDate}
        events={[]}
        stats={mockStats}
        loading={true}
        onEventPress={mockOnEventPress}
      />
    );

    expect(getByText('Cargando eventos...')).toBeTruthy();
  });

  it('renders empty state', () => {
    const { getByText } = render(
      <DayDetail
        date={mockDate}
        events={[]}
        stats={{ taken: 0, missed: 0, skipped: 0, total: 0 }}
        loading={false}
        onEventPress={mockOnEventPress}
      />
    );

    expect(getByText('No hay eventos para este día')).toBeTruthy();
  });
});
