import React, { useState } from 'react';
import { View, Text, Modal, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

interface Props {
  times: string[];
  onTimesChange: (times: string[]) => void;
  error?: string;
}

export default function ReminderTimePicker({ times, onTimesChange, error }: Props) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const showTimePicker = (index: number | null = null) => {
    setEditingIndex(index);
    if (index !== null) {
      const [hours, minutes] = times[index].split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      setTempDate(date);
    } else {
      setTempDate(new Date());
    }
    setPickerVisible(true);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
    }

    if (event.type === 'set' && selectedDate) {
      const timeString = selectedDate.toTimeString().slice(0, 5);
      
      if (editingIndex !== null) {
        const newTimes = [...times];
        newTimes[editingIndex] = timeString;
        onTimesChange(newTimes);
      } else {
        onTimesChange([...times, timeString]);
      }

      if (Platform.OS === 'ios') {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirmIOSTime = () => {
    const timeString = tempDate.toTimeString().slice(0, 5);
    if (editingIndex !== null) {
      const newTimes = [...times];
      newTimes[editingIndex] = timeString;
      onTimesChange(newTimes);
    } else {
      onTimesChange([...times, timeString]);
    }
    setPickerVisible(false);
  };

  const handleRemoveTime = (index: number) => {
    onTimesChange(times.filter((_, i) => i !== index));
  };

  const displayTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Horas de Recordatorio</Text>
      <View style={styles.minHeight48}>
        {times.length === 0 ? (
          <Button onPress={() => showTimePicker()} variant="secondary" style={styles.justifyCenter}>
            <View style={styles.buttonContent}>
              <Text style={styles.addTimeText}>Añadir hora</Text>
              <Ionicons name="time-outline" size={20} color="#3B82F6" />
            </View>
          </Button>
        ) : (
          <View style={styles.timesContainer}>
            {times.map((time, index) => (
              <View key={index} style={styles.timePill}>
                <Text style={styles.timeText}>{displayTime(time)}</Text>
                <TouchableOpacity onPress={() => showTimePicker(index)}>
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveTime(index)}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <Button onPress={() => showTimePicker()} variant="secondary" style={styles.addButton}>
              <Ionicons name="add" size={16} color="#3B82F6" />
            </Button>
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {Platform.OS === 'android' && isPickerVisible && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={isPickerVisible} transparent={true} animationType="slide">
          <View style={styles.iosModalContainer}>
            <Card style={styles.iosModalCard}>
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
              />
              <View style={styles.iosModalButtons}>
                <Button onPress={() => setPickerVisible(false)} variant="secondary" style={styles.flex1}>
                  Cancelar
                </Button>
                <Button onPress={handleConfirmIOSTime} variant="primary" style={styles.flex1}>
                  Confirmar
                </Button>
              </View>
            </Card>
          </View>
        </Modal>
      )}
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
  minHeight48: {
    minHeight: 48,
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTimeText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  addButton: {
    padding: 4,
    borderRadius: 9999,
    height: 32,
    width: 32,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 4,
  },
  iosModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iosModalCard: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  iosModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  flex1: {
    flex: 1,
  },
});
