import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal as RNModal,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from '../../ui';
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
                  ? `${hour.toString().padStart(2, '0')}:00 - ${medicationCount} medicamento${medicationCount > 1 ? 's' : ''} programado${medicationCount > 1 ? 's' : ''}`
                  : `${hour.toString().padStart(2, '0')}:00 - Sin medicamentos`
              }
            >
              {/* Hour marker */}
              <View style={styles.hourMarker}>
                <Text style={styles.hourLabel}>
                  {hour.toString().padStart(2, '0')}
                </Text>
              </View>
              
              {/* Medication indicator */}
              {hasMedication && (
                <View style={styles.medicationIndicator}>
                  <Text 
                    style={styles.medicationEmoji}
                    accessible={false}
                  >
                    {emoji}
                  </Text>
                  {medicationCount > 1 && (
                    <View style={styles.medicationBadge}>
                      <Text style={styles.medicationBadgeText}>
                        {medicationCount}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Hour line */}
              <View style={[
                styles.hourLine,
                hasMedication && styles.hourLineActive
              ]} />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

interface TimeCardProps {
  time: string;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
  formatTime: (time: string) => string;
}

// TimeCard Component - Modern card design with icons
const TimeCard = React.memo(function TimeCard({ time, index, onEdit, onDelete, canDelete, formatTime }: TimeCardProps) {
  return (
    <View 
      style={styles.timeCard}
      accessible={true}
      accessibilityLabel={`Horario ${index + 1}: ${formatTime(time)}`}
    >
      <TouchableOpacity 
        style={styles.timeCardContent}
        onPress={onEdit}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`Editar horario ${formatTime(time)}`}
        accessibilityHint="Toca para cambiar este horario"
        accessibilityRole="button"
      >
        <View style={styles.timeCardIcon}>
          <Text style={styles.timeCardEmoji}>🕐</Text>
        </View>
        <View style={styles.timeCardInfo}>
          <Text style={styles.timeCardLabel}>Horario {index + 1}</Text>
          <Text style={styles.timeCardTime}>{formatTime(time)}</Text>
        </View>
        <View style={styles.timeCardActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={onEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel="Editar"
            accessibilityRole="button"
          >
            <Ionicons name="pencil" size={20} color={colors.primary[500]} />
          </TouchableOpacity>
          {canDelete && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={onDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityLabel="Eliminar"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color={colors.error[500]} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
});

interface MedicationScheduleStepProps {
  // No props needed - uses wizard context
}

export const MedicationScheduleStep = React.memo(function MedicationScheduleStep({}: MedicationScheduleStepProps) {
  const { formData, updateFormData, setCanProceed } = useWizardContext();
  const { width: screenWidth } = useWindowDimensions();

  const [times, setTimes] = useState<string[]>(formData.times || ['08:00']);
  const [frequency, setFrequency] = useState<string[]>(
    formData.frequency || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [tempTime, setTempTime] = useState(new Date());
  const [use24Hour, setUse24Hour] = useState(true);

  // Calculate responsive layout values
  const responsiveLayout = useMemo(() => {
    // Determine if we're on a small, medium, or large screen
    const isSmallScreen = screenWidth < 360;
    const isTablet = screenWidth >= 768;
    
    return {
      isSmallScreen,
      isTablet,
      cardPadding: isSmallScreen ? spacing.md : isTablet ? spacing.xl : spacing.lg,
      iconSize: isSmallScreen ? 40 : isTablet ? 56 : 48,
      timeCardGap: isSmallScreen ? spacing.sm : spacing.md,
      dayChipSize: isSmallScreen ? 'sm' as const : 'md' as const,
    };
  }, [screenWidth]);

  // Detect device time format preference
  useEffect(() => {
    // Default to 24-hour format for consistency
    // iOS will show 12/24 based on device settings automatically
    setUse24Hour(true);
  }, []);

  // Validation function
  const validateFields = (currentTimes: string[], currentFrequency: string[]): boolean => {
    // Must have at least one time
    if (currentTimes.length === 0) {
      return false;
    }

    // Must have at least one day selected
    if (currentFrequency.length === 0) {
      return false;
    }

    // All times must be valid
    const allTimesValid = currentTimes.every(time => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(time);
    });

    return allTimesValid;
  };

  // Update validation whenever times or frequency changes
  useEffect(() => {
    const isValid = validateFields(times, frequency);
    setCanProceed(isValid);
    updateFormData({ times, frequency });
  }, [times, frequency]);

  // Handle day selection
  const handleDayToggle = useCallback((dayValue: string) => {
    let newFrequency: string[];
    
    if (frequency.includes(dayValue)) {
      // Remove day (but keep at least one)
      if (frequency.length > 1) {
        newFrequency = frequency.filter(d => d !== dayValue);
      } else {
        return; // Don't allow removing the last day
      }
    } else {
      // Add day
      newFrequency = [...frequency, dayValue];
    }
    
    setFrequency(newFrequency);
  }, [frequency]);

  // Handle adding a new time
  const handleAddTime = useCallback(() => {
    const now = new Date();
    
    setTempTime(now);
    setEditingTimeIndex(times.length);
    setShowTimePicker(true);
  }, [times.length]);

  // Handle editing an existing time
  const handleEditTime = useCallback((index: number) => {
    const timeStr = times[index];
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    
    setTempTime(date);
    setEditingTimeIndex(index);
    setShowTimePicker(true);
  }, [times]);

  // Handle removing a time
  const handleRemoveTime = useCallback((index: number) => {
    // Keep at least one time
    if (times.length > 1) {
      const newTimes = times.filter((_, i) => i !== index);
      setTimes(newTimes);
    }
  }, [times]);

  // Handle time picker change (for Android)
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);

    if (event.type === 'set' && selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      if (editingTimeIndex !== null) {
        const newTimes = [...times];
        if (editingTimeIndex >= newTimes.length) {
          // Adding new time
          newTimes.push(timeStr);
        } else {
          // Editing existing time
          newTimes[editingTimeIndex] = timeStr;
        }
        // Sort times chronologically
        newTimes.sort();
        setTimes(newTimes);
      }
      setEditingTimeIndex(null);
    } else if (event.type === 'dismissed') {
      setEditingTimeIndex(null);
    }
  };

  // Handle iOS time picker confirm
  const handleIOSConfirm = () => {
    const hours = tempTime.getHours().toString().padStart(2, '0');
    const minutes = tempTime.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (editingTimeIndex !== null) {
      const newTimes = [...times];
      if (editingTimeIndex >= newTimes.length) {
        // Adding new time
        newTimes.push(timeStr);
      } else {
        // Editing existing time
        newTimes[editingTimeIndex] = timeStr;
      }
      // Sort times chronologically
      newTimes.sort();
      setTimes(newTimes);
    }
    
    setShowTimePicker(false);
    setEditingTimeIndex(null);
  };

  // Handle iOS time picker cancel
  const handleIOSCancel = () => {
    setShowTimePicker(false);
    setEditingTimeIndex(null);
  };

  // Format time for display
  const formatTime = useCallback((timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    if (use24Hour) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
  }, [use24Hour]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel="Paso 2: Configuración de horario"
      accessibilityHint="Configura los horarios y días para tomar tu medicamento"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Horario</Text>
        <Text style={styles.subtitle}>
          Configura cuándo debes tomar tu medicamento
        </Text>
      </View>

      {/* Times Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Horarios <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.helperText}>
          Selecciona los horarios en los que debes tomar tu medicamento
        </Text>

        {/* Time List */}
        <View style={[styles.timeList, { gap: responsiveLayout.timeCardGap }]}>
          {times.map((time, index) => (
            <TimeCard
              key={index}
              time={time}
              index={index}
              onEdit={() => handleEditTime(index)}
              onDelete={() => handleRemoveTime(index)}
              canDelete={times.length > 1}
              formatTime={formatTime}
            />
          ))}
        </View>

        {/* Add Time Button */}
        {times.length < 6 && (
          <TouchableOpacity
            style={styles.addTimeButton}
            onPress={handleAddTime}
            accessible={true}
            accessibilityLabel="Agregar horario"
            accessibilityHint="Toca para agregar un nuevo horario"
            accessibilityRole="button"
          >
            <Text style={styles.addTimeIcon}>+</Text>
            <Text style={styles.addTimeText}>Agregar horario</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Days of Week Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Días de la semana <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.helperText}>
          Selecciona los días en los que debes tomar tu medicamento
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScrollContent}
          accessible={true}
          accessibilityLabel="Selector de días de la semana"
          accessibilityRole="menu"
        >
          {DAYS_OF_WEEK.map((day) => (
            <Chip
              key={day.value}
              label={day.label}
              selected={frequency.includes(day.value)}
              onPress={() => handleDayToggle(day.value)}
              variant="outlined"
              color="primary"
              size={responsiveLayout.dayChipSize}
              style={styles.dayChip}
              accessibilityLabel={day.fullName}
              accessibilityHint={
                frequency.includes(day.value)
                  ? `${day.fullName} está seleccionado. Toca para deseleccionar`
                  : `${day.fullName} no está seleccionado. Toca para seleccionar`
              }
            />
          ))}
        </ScrollView>
      </View>

      {/* Visual Timeline Preview */}
      {times.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vista previa del día</Text>
          <Text style={styles.helperText}>
            Visualiza cuándo tomarás tu medicamento durante el día
          </Text>
          <CustomTimeline times={times} emoji={formData.emoji || '💊'} />
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Puedes agregar hasta 6 horarios diferentes por día. Los horarios se ordenarán automáticamente.
        </Text>
      </View>

      {/* Time Picker Modal - iOS */}
      {Platform.OS === 'ios' && showTimePicker && (
        <RNModal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleIOSCancel}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={handleIOSCancel}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    onPress={handleIOSCancel}
                    style={styles.pickerButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.pickerButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Seleccionar hora</Text>
                  <TouchableOpacity
                    onPress={handleIOSConfirm}
                    style={styles.pickerButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.pickerButtonText, styles.pickerButtonPrimary]}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timePickerWrapper}>
                  <DateTimePicker
                    value={tempTime}
                    mode="time"
                    is24Hour={use24Hour}
                    display="spinner"
                    onChange={(_event, date) => {
                      if (date) setTempTime(date);
                    }}
                    style={styles.timePicker}
                    textColor={colors.gray[900]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </RNModal>
      )}

      {/* Time Picker - Android */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={use24Hour}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
});

// Visual Timeline Component will be implemented in task 6

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
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  required: {
    color: colors.error[500],
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },

  // Time List
  timeList: {
    gap: spacing.md,
  },

  // TimeCard Styles
  timeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  timeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  timeCardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCardEmoji: {
    fontSize: 24,
  },
  timeCardInfo: {
    flex: 1,
  },
  timeCardLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  timeCardTime: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    letterSpacing: -0.5,
  },
  timeCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Add Time Button
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderStyle: 'dashed',
    gap: spacing.md,
    minHeight: 60,
    marginTop: spacing.sm,
  },
  addTimeIcon: {
    fontSize: 28,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
  addTimeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    letterSpacing: -0.3,
  },

  // Days Scroll Container
  daysScrollContent: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
    paddingRight: spacing.lg,
  },
  dayChip: {
    minWidth: 48,
    minHeight: 48,
  },

  // Timeline
  timeline: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  timelineContent: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  timelineHour: {
    alignItems: 'center',
    width: 60,
  },
  hourMarker: {
    marginBottom: spacing.xs,
  },
  hourLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontWeight: typography.fontWeight.medium,
  },
  medicationIndicator: {
    position: 'relative',
    marginBottom: spacing.xs,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationEmoji: {
    fontSize: 28,
  },
  medicationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  medicationBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
  hourLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
  },
  hourLineActive: {
    backgroundColor: colors.primary[500],
    width: 3,
  },

  // iOS Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'transparent',
  },
  
  // Time Picker
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 0 : spacing.lg,
    ...shadows.lg,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.gray[50],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  pickerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    letterSpacing: -0.3,
  },
  pickerButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 80,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },
  pickerButtonPrimary: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  timePickerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  timePicker: {
    width: '100%',
    height: 216,
    backgroundColor: colors.surface,
  },

  // Info Box
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
    fontSize: 22,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
