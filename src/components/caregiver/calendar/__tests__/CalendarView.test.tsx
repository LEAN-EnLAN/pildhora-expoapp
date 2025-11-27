import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalendarView } from '../CalendarView';
import { addMonths, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

describe('CalendarView', () => {
  const mockDate = new Date('2023-10-15T12:00:00Z');
  const mockOnDateSelect = jest.fn();
  const mockOnMonthChange = jest.fn();
  const mockAdherenceData = {
    '2023-10-15': { status: 'complete' as const },
    '2023-10-16': { status: 'missed' as const },
  };

  it('renders correctly', () => {
    const { getByText } = render(
      <CalendarView
        currentDate={mockDate}
        selectedDate={mockDate}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
        adherenceData={mockAdherenceData}
      />
    );

    // Check month title
    expect(getByText(format(mockDate, 'MMMM yyyy', { locale: es }))).toBeTruthy();
    
    // Check week days
    expect(getByText('Dom')).toBeTruthy();
    expect(getByText('Lun')).toBeTruthy();

    // Check day numbers (15 should be visible)
    expect(getByText('15')).toBeTruthy();
  });

  it('handles date selection', () => {
    const { getByText } = render(
      <CalendarView
        currentDate={mockDate}
        selectedDate={mockDate}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
        adherenceData={mockAdherenceData}
      />
    );

    fireEvent.press(getByText('16'));
    expect(mockOnDateSelect).toHaveBeenCalled();
  });

  it('handles month navigation', () => {
    const { getByTestId } = render(
      <CalendarView
        currentDate={mockDate}
        selectedDate={mockDate}
        onDateSelect={mockOnDateSelect}
        onMonthChange={mockOnMonthChange}
        adherenceData={mockAdherenceData}
      />
    );

    fireEvent.press(getByTestId('prev-month-button'));
    expect(mockOnMonthChange).toHaveBeenCalled();

    fireEvent.press(getByTestId('next-month-button'));
    expect(mockOnMonthChange).toHaveBeenCalledTimes(2);
  });
});
