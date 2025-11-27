import React from 'react';
import { render } from '@testing-library/react-native';
import { AdherenceChart, AdherenceDay } from '../AdherenceChart';

describe('AdherenceChart', () => {
  const mockWeeklyStats: AdherenceDay[] = [
    { day: 'Lun', percentage: 100, status: 'good', dateStr: '2023-10-23' },
    { day: 'Mar', percentage: 50, status: 'warning', dateStr: '2023-10-24' },
    { day: 'Mié', percentage: 0, status: 'bad', dateStr: '2023-10-25' },
    { day: 'Jue', percentage: 0, status: 'future', dateStr: '2023-10-26' },
  ];

  it('renders correctly with data', () => {
    const { getByText } = render(<AdherenceChart weeklyStats={mockWeeklyStats} />);
    
    expect(getByText('Adherencia Semanal')).toBeTruthy();
    expect(getByText('Lun')).toBeTruthy();
    expect(getByText('Mar')).toBeTruthy();
    expect(getByText('Mié')).toBeTruthy();
    expect(getByText('Jue')).toBeTruthy();
  });

  it('renders loading state', () => {
    const { getByText } = render(<AdherenceChart weeklyStats={[]} loading={true} />);
    expect(getByText('Cargando estadísticas...')).toBeTruthy();
  });

  it('renders empty state', () => {
    const { getByText } = render(<AdherenceChart weeklyStats={[]} loading={false} />);
    expect(getByText('No hay datos suficientes para esta semana')).toBeTruthy();
  });
});
