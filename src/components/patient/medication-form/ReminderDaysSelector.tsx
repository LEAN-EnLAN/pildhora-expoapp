import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Días de Recordatorio</Text>
      {DAYS.map(day => (
        <View key={day.id} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{day.label}</Text>
          <Switch
            value={selectedDays.includes(day.id)}
            onValueChange={() => toggleDay(day.id)}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={selectedDays.includes(day.id) ? "#007AFF" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      ))}
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
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayLabel: {
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 4,
  },
});
