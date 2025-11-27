import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../../theme/tokens';

interface CalendarViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  selectedDate: Date;
  adherenceData?: Record<string, { status: 'complete' | 'partial' | 'missed' | 'none' }>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onDateSelect,
  onMonthChange,
  selectedDate,
  adherenceData = {},
}) => {
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const handlePrevMonth = () => onMonthChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentDate, 1));

  const getStatusColor = (dateStr: string) => {
    const status = adherenceData[dateStr]?.status;
    switch (status) {
      case 'complete': return colors.success[500];
      case 'partial': return colors.warning[500];
      case 'missed': return colors.error[500];
      default: return 'transparent';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton} testID="prev-month-button">
          <Ionicons name="chevron-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton} testID="next-month-button">
          <Ionicons name="chevron-forward" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View style={styles.weekRow}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const statusColor = getStatusColor(dateStr);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDay,
                !isCurrentMonth && styles.outsideMonth
              ]}
              onPress={() => onDateSelect(day)}
            >
              <Text style={[
                styles.dayText,
                isSelected && styles.selectedDayText,
                !isCurrentMonth && styles.outsideMonthText
              ]}>
                {format(day, 'd')}
              </Text>
              {/* Adherence Dot */}
              <View style={[styles.dot, { backgroundColor: isSelected ? 'white' : statusColor }]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textTransform: 'capitalize',
  },
  arrowButton: {
    padding: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xs,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontWeight: typography.fontWeight.medium,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: colors.primary[500],
  },
  outsideMonth: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  outsideMonthText: {
    color: colors.gray[400],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
});
