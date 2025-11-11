import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../../ui/Button';

interface Props {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  error?: string;
}

const DAYS = [
  { id: 'Mon', label: 'Lun' }, { id: 'Tue', label: 'Mar' }, { id: 'Wed', label: 'Mié' },
  { id: 'Thu', label: 'Jue' }, { id: 'Fri', label: 'Vie' }, { id: 'Sat', label: 'Sáb' },
  { id: 'Sun', label: 'Dom' },
];

const QUICK_SELECT_OPTIONS = [
  { id: 'weekdays', label: 'Días de semana', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { id: 'weekends', label: 'Fines de semana', days: ['Sat', 'Sun'] },
  { id: 'all', label: 'Todos', days: DAYS.map(d => d.id) },
];

export default function ReminderDaysSelector({ selectedDays, onDaysChange, error }: Props) {
  const toggleDay = (dayId: string) => {
    onDaysChange(
      selectedDays.includes(dayId)
        ? selectedDays.filter(d => d !== dayId)
        : [...selectedDays, dayId]
    );
  };

  const getQuickSelectVariant = (days: string[]) => {
    const isAll = days.every(day => selectedDays.includes(day));
    const isPartially = days.some(day => selectedDays.includes(day)) && !isAll;
    if (isAll) return 'primary';
    if (isPartially) return 'secondary';
    return 'secondary';
  };

  return (
    <View className="mb-4">
      <Text className="text-lg font-bold mb-2 text-gray-800">Días de Recordatorio</Text>
      <View className="flex-row justify-between mb-4">
        {DAYS.map(day => (
          <Button
            key={day.id}
            onPress={() => toggleDay(day.id)}
            className="w-10 h-10 rounded-full items-center justify-center"
            variant={selectedDays.includes(day.id) ? 'primary' : 'secondary'}
          >
            {day.label}
          </Button>
        ))}
      </View>
      <View>
        <Text className="text-base font-medium mb-2 text-gray-700">Selección rápida:</Text>
        <View className="flex-row flex-wrap gap-2">
          {QUICK_SELECT_OPTIONS.map(option => (
            <Button
              key={option.id}
              onPress={() => onDaysChange(option.days)}
              variant={getQuickSelectVariant(option.days)}
              size="sm"
            >
              {option.label}
            </Button>
          ))}
        </View>
      </View>
      {error && <Text className="text-red-500 mt-1">{error}</Text>}
    </View>
  );
}