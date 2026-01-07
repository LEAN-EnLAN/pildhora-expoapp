import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal as RNModal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useWizardContext } from './WizardContext';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

// Days of the week
const DAYS_OF_WEEK = [
  { label: 'Lun', value: 'Mon', fullName: 'Lunes' },
  { label: 'Mar', value: 'Tue', fullName: 'Martes' },
  { label: 'Mié', value: 'Wed', fullName: 'Miércoles' },
  { label: 'Jue', value: 'Thu', fullName: 'Jueves' },
  { label: 'Vie', value: 'Fri', fullName: 'Viernes' },
  { label: 'Sáb', value: 'Sat', fullName: 'Sábado' },
  { label: 'Dom', value: 'Sun', fullName: 'Domingo' },
];

const DAILY_FREQUENCY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const QUICK_ACTIONS = [
  { label: 'Cada turno mañana', time: '08:00' },
  { label: 'Cada turno mediodía', time: '12:00' },
  { label: 'Cada turno tarde', time: '16:00' },
  { label: 'Cada turno noche', time: '22:00' },
];

interface CustomTimelineProps {
  times: string[];
  emoji?: string;
}

// CustomTimeline Component - Visual 24-hour timeline
const CustomTimeline = React.memo(function CustomTimeline({ times, emoji = '💊' }: CustomTimelineProps) {
  // Convert times to hours for visualization
  const timeHours = times.map(time => {
    const [hours] = time.split(':').map(Number);
    return hours;
  });

  // Count medications per hour
  const medicationCountByHour = timeHours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <View
      style={styles.timeline}
      accessible={true}
      accessibilityLabel="Vista previa del horario del día"
      accessibilityHint={`Muestra ${times.length} horario${times.length !== 1 ? 's' : ''} programado${times.length !== 1 ? 's' : ''} durante el día`}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
        accessible={false}
      >
        {Array.from({ length: 24 }).map((_, hour) => {
          const hasMedication = timeHours.includes(hour);
          const medicationCount = medicationCountByHour[hour] || 0;

          return (
            <View
              key={hour}
              style={styles.timelineHour}
              accessible={true}
              accessibilityLabel={
                hasMedication
                  ? `${hour}:00 hours, ${medicationCount} medication${medicationCount !== 1 ? 's' : ''}`
                  : `${hour}:00 hours, no medications`
              }
            >
              <Text style={[styles.timelineHourText, hasMedication && styles.timelineHourTextActive]}>
                {hour}
              </Text>
              <View style={styles.timelineTrack}>
                {hasMedication ? (
                  <View style={styles.timelineDot}>
                    <Text style={styles.timelineEmoji}>{emoji}</Text>
                    {medicationCount > 1 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{medicationCount}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.timelineLine} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

export function MedicationScheduleStep() {
  const { formData, updateFormData, setCanProceed } = useWizardContext();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Initialize with at least one time if empty
  useEffect(() => {
    if (!formData.times || formData.times.length === 0) {
      updateFormData({
        times: ['08:00'],
        frequency: (!formData.frequency || formData.frequency.length === 0)
          ? DAILY_FREQUENCY
          : formData.frequency,
      });
    }
  }, []);

  // Validate step
  useEffect(() => {
    const hasTimes = formData.times && formData.times.length > 0;
    const hasDays = formData.frequency && formData.frequency.length > 0;
    setCanProceed(!!hasTimes && !!hasDays);
  }, [formData.times, formData.frequency, setCanProceed]);

  const handleTimeChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selectedDate) {
      if (Platform.OS === 'ios') {
        setTempDate(selectedDate);
      } else {
        // For Android, update immediately
        const timeString = selectedDate.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });

        const currentTimes = [...(formData.times || [])];

        if (editingIndex !== null) {
          currentTimes[editingIndex] = timeString;
        } else {
          currentTimes.push(timeString);
          currentTimes.sort();
        }

        updateFormData({
          times: currentTimes,
        });
        setEditingIndex(null);
      }
    }
  };

  const handleIOSConfirm = () => {
    const timeString = tempDate.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    const currentTimes = [...(formData.times || [])];

    if (editingIndex !== null) {
      currentTimes[editingIndex] = timeString;
    } else {
      currentTimes.push(timeString);
      currentTimes.sort();
    }

    updateFormData({
      times: currentTimes,
    });
    setShowTimePicker(false);
    setEditingIndex(null);
  };

  const handleIOSCancel = () => {
    setShowTimePicker(false);
    setEditingIndex(null);
  };

  const handleAddTime = () => {
    setTempDate(new Date());
    setEditingIndex(null);
    setShowTimePicker(true);
  };

  const handleEditTime = (time: string, index: number) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    setTempDate(date);
    setEditingIndex(index);
    setShowTimePicker(true);
  };

  const handleRemoveTime = (index: number) => {
    const currentTimes = [...(formData.times || [])];
    if (currentTimes.length > 1) {
      currentTimes.splice(index, 1);
      updateFormData({
        times: currentTimes,
      });
    }
  };

  const handleQuickAction = (time: string) => {
    updateFormData({
      times: [time],
      frequency: DAILY_FREQUENCY,
    });
  };

  const handleToggleDay = (dayValue: string) => {
    const currentDays = [...(formData.frequency || [])];
    const index = currentDays.indexOf(dayValue);

    if (index >= 0) {
      if (currentDays.length > 1) {
        currentDays.splice(index, 1);
      }
    } else {
      currentDays.push(dayValue);
    }

    updateFormData({
      frequency: currentDays,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Horario y Frecuencia</Text>
          <Text style={styles.subtitle}>
            Configura cuándo debe tomarse este medicamento
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Acciones rápidas</Text>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionChip}
                onPress={() => handleQuickAction(action.time)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionTime}>{action.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Times Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Horarios de toma</Text>
          <View style={styles.timesList}>
            {formData.times?.map((time, index) => (
              <View key={`${time}-${index}`} style={styles.timeRow}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => handleEditTime(time, index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={24} color={colors.primary[600]} />
                  <Text style={styles.timeText}>{time}</Text>
                </TouchableOpacity>

                {formData.times && formData.times.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveTime(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error[500]} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddTime}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={colors.primary[600]} />
              <Text style={styles.addButtonText}>Agregar horario</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Days Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Días de la semana</Text>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = formData.frequency?.includes(day.value);
              return (
                <View
                  key={day.value}
                  style={[
                    styles.dayChip,
                    isSelected && styles.dayChipSelected,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleToggleDay(day.value)}
                    style={styles.dayChipButton}
                  >
                    <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vista previa</Text>
          <CustomTimeline times={formData.times || []} />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={colors.primary[600]} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Se enviarán recordatorios a tu dispositivo y a tus cuidadores si olvidas una toma.
          </Text>
        </View>
      </ScrollView>

      {/* iOS Time Picker Modal */}
      {Platform.OS === 'ios' && (
        <RNModal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={handleIOSCancel}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              onPress={handleIOSCancel}
              activeOpacity={1}
            />
            <SafeAreaView style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={handleIOSCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>
                  {editingIndex !== null ? 'Editar hora' : 'Nueva hora'}
                </Text>
                <TouchableOpacity onPress={handleIOSConfirm} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timePickerWrapper}>
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  style={styles.timePicker}
                  textColor={colors.gray[900]}
                />
              </View>
            </SafeAreaView>
          </View>
        </RNModal>
      )}

      {/* Android Time Picker */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'] * 2,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  timesList: {
    gap: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionChip: {
    flexBasis: '48%',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary[100],
    ...shadows.sm,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
    marginBottom: spacing.xs / 2,
  },
  quickActionTime: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    height: 60,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    gap: spacing.md,
    ...shadows.sm,
  },
  timeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
    letterSpacing: 0.5,
  },
  removeButton: {
    width: 48,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error[100],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[700],
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayChip: {
    minWidth: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    overflow: 'hidden',
  },
  dayChipSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[600],
  },
  dayChipButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipText: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
  },
  dayChipTextSelected: {
    color: colors.surface,
  },
  timeline: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  timelineContent: {
    paddingHorizontal: spacing.xs,
  },
  timelineHour: {
    alignItems: 'center',
    width: 40,
    gap: spacing.xs,
  },
  timelineHourText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    fontWeight: typography.fontWeight.medium,
  },
  timelineHourTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  timelineTrack: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.gray[100],
  },
  timelineDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineEmoji: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  pickerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  timePickerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingBottom: spacing.xl,
  },
  timePicker: {
    width: '100%',
    height: 216,
    backgroundColor: colors.surface,
  },
});
