import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '../../ui/Button';

interface Props {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  error?: string;
}

const DAYS = [
  { id: 'Mon', label: 'Lunes' },
  { id: 'Tue', label: 'Martes' },
  { id: 'Wed', label: 'Miércoles' },
  { id: 'Thu', label: 'Jueves' },
  { id: 'Fri', label: 'Viernes' },
  { id: 'Sat', label: 'Sábado' },
  { id: 'Sun', label: 'Domingo' },
];

export default function ReminderDaysSelector({ selectedDays, onDaysChange, error }: Props) {
  const toggleDay = (dayId: string) => {
    onDaysChange(
      selectedDays.includes(dayId)
        ? selectedDays.filter(d => d !== dayId)
        : [...selectedDays, dayId]
    );
  };

  const setWeekdays = () => {
    onDaysChange(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  };

  const setWeekends = () => {
    onDaysChange(['Sat', 'Sun']);
  };

  const setAll = () => {
    onDaysChange(DAYS.map(d => d.id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Días de Recordatorio</Text>
      <View style={styles.quickRow}> 
        <Button variant="secondary" onPress={setWeekdays} style={styles.quickButton}>Semana</Button>
        <Button variant="secondary" onPress={setWeekends} style={styles.quickButton}>Fin de semana</Button>
        <Button variant="secondary" onPress={setAll} style={styles.quickButton}>Todos</Button>
      </View>

      <View style={styles.chipsRow}>
        {DAYS.map(day => (
          <TouchableOpacity
            key={day.id}
            onPress={() => toggleDay(day.id)}
            style={[styles.chip, selectedDays.includes(day.id) ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={[styles.chipText, selectedDays.includes(day.id) ? styles.chipTextActive : styles.chipTextInactive]}>
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickButton: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipInactive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextInactive: {
    color: '#1F2937',
  },
  chipTextActive: {
    color: '#1F2937',
  },
  errorText: {
    color: '#EF4444',
    marginTop: 4,
  },
});
