import React, { useState } from 'react';
import { View, Text, Modal, Platform, TouchableOpacity } from 'react-native';
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

      // For iOS, user must confirm, so we only update the temp date here
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
    <View className="mb-4">
      <Text className="text-lg font-bold mb-2 text-gray-800">Horas de Recordatorio</Text>
      <View className="min-h-[48px]">
        {times.length === 0 ? (
          <Button onPress={() => showTimePicker()} variant="secondary" className="justify-center">
            <View className="flex-row items-center gap-2">
              <Text className="text-blue-500 font-semibold">Añadir hora</Text>
              <Ionicons name="time-outline" size={20} color="#3B82F6" />
            </View>
          </Button>
        ) : (
          <View className="flex-row flex-wrap gap-2 items-center">
            {times.map((time, index) => (
              <View key={index} className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5 gap-2">
                <Text className="text-sm text-gray-800 font-medium">{displayTime(time)}</Text>
                <TouchableOpacity onPress={() => showTimePicker(index)}>
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveTime(index)}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <Button onPress={() => showTimePicker()} variant="secondary" className="p-1 rounded-full h-8 w-8">
              <Ionicons name="add" size={16} color="#3B82F6" />
            </Button>
          </View>
        )}
      </View>
      {error && <Text className="text-red-500 mt-1">{error}</Text>}

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
          <View className="flex-1 bg-black/50 justify-end">
            <Card className="rounded-b-none">
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
              />
              <View className="flex-row justify-between gap-4 mt-4">
                <Button onPress={() => setPickerVisible(false)} variant="secondary" className="flex-1">
                  Cancelar
                </Button>
                <Button onPress={handleConfirmIOSTime} variant="primary" className="flex-1">
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