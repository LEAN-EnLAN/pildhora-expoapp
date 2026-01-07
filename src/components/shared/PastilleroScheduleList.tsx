/**
 * PastilleroScheduleList Component
 * 
 * Displays a list of pastillero schedule entries with color-coded turno indicators.
 * Includes an upload button to sync the schedule to Firebase RTDB.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';
import {
  DEMO_PASTILLERO_SCHEDULE,
  TURNO_COLORS,
  uploadPastilleroData,
} from '../../services/pastilleroService';
import type { DemoScheduleEntry, TurnoType } from '../../types';

interface PastilleroScheduleListProps {
  /** Device ID for uploading schedule data */
  deviceId: string;
  /** Optional custom schedule (defaults to DEMO_PASTILLERO_SCHEDULE) */
  schedule?: DemoScheduleEntry[];
  /** Callback when upload succeeds */
  onUploadSuccess?: () => void;
  /** Callback when upload fails */
  onUploadError?: (error: Error) => void;
  /** Whether to show the upload button */
  showUploadButton?: boolean;
}

/** Get turno icon based on turno type */
const getTurnoIcon = (turno: TurnoType): keyof typeof Ionicons.glyphMap => {
  switch (turno) {
    case 0: return 'sunny';        // Mañana
    case 1: return 'sunny-outline'; // Mediodía
    case 2: return 'partly-sunny'; // Tarde
    case 3: return 'moon';         // Noche
    default: return 'time';
  }
};

/** Schedule item component */
const ScheduleItem: React.FC<{ item: DemoScheduleEntry }> = React.memo(({ item }) => {
  const turnoColor = TURNO_COLORS[item.turno as TurnoType];
  const iconName = getTurnoIcon(item.turno as TurnoType);

  return (
    <View
      style={styles.scheduleItem}
      accessible={true}
      accessibilityLabel={`${item.diaName}, ${item.turnoName} a las ${item.hora}`}
    >
      <View style={[styles.turnoIndicator, { backgroundColor: turnoColor }]}>
        <Ionicons name={iconName} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.scheduleContent}>
        <Text style={styles.dayName}>{item.diaName}</Text>
        <View style={styles.scheduleDetails}>
          <Text style={[styles.turnoName, { color: turnoColor }]}>{item.turnoName}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.hora}>{item.hora}</Text>
        </View>
      </View>
    </View>
  );
});

export const PastilleroScheduleList: React.FC<PastilleroScheduleListProps> = ({
  deviceId,
  schedule = DEMO_PASTILLERO_SCHEDULE,
  onUploadSuccess,
  onUploadError,
  showUploadButton = true,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!deviceId) {
      Alert.alert('Error', 'No se ha configurado el dispositivo');
      return;
    }

    setUploading(true);
    try {
      await uploadPastilleroData(deviceId, schedule);
      Alert.alert('Éxito', 'Horarios sincronizados correctamente con el dispositivo');
      onUploadSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      Alert.alert('Error', `No se pudieron sincronizar los horarios: ${err.message}`);
      onUploadError?.(err);
    } finally {
      setUploading(false);
    }
  }, [deviceId, schedule, onUploadSuccess, onUploadError]);

  const renderItem = useCallback(
    ({ item }: { item: DemoScheduleEntry }) => <ScheduleItem item={item} />,
    []
  );

  const keyExtractor = useCallback(
    (item: DemoScheduleEntry) => `${item.dia}-${item.turno}`,
    []
  );

  // Sort schedule by day (Monday first, Sunday last)
  const sortedSchedule = [...schedule].sort((a, b) => {
    // Convert to Monday-first order (1-6, then 0)
    const orderA = a.dia === 0 ? 7 : a.dia;
    const orderB = b.dia === 0 ? 7 : b.dia;
    return orderA - orderB;
  });

  return (
    <Card variant="elevated" padding="lg" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="calendar" size={24} color={colors.primary[500]} />
          <Text style={styles.title}>Horarios del Pastillero</Text>
        </View>
        <Text style={styles.subtitle}>
          {schedule.length} dosis programadas por semana
        </Text>
      </View>

      <FlatList
        data={sortedSchedule}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        contentContainerStyle={styles.listContent}
        accessibilityLabel="Lista de horarios programados"
      />

      {/* Color legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: TURNO_COLORS[0] }]} />
          <Text style={styles.legendText}>Mañana</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: TURNO_COLORS[1] }]} />
          <Text style={styles.legendText}>Mediodía</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: TURNO_COLORS[2] }]} />
          <Text style={styles.legendText}>Tarde</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: TURNO_COLORS[3] }]} />
          <Text style={styles.legendText}>Noche</Text>
        </View>
      </View>

      {showUploadButton && (
        <Button
          onPress={handleUpload}
          variant="primary"
          loading={uploading}
          disabled={!deviceId}
          fullWidth
          leftIcon={<Ionicons name="cloud-upload" size={20} color="#FFFFFF" />}
          accessibilityLabel="Sincronizar horarios con el dispositivo"
          accessibilityHint="Sube los horarios programados al pastillero"
        >
          Sincronizar con Dispositivo
        </Button>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginLeft: spacing['3xl'],
  },
  listContent: {
    marginBottom: spacing.lg,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  turnoIndicator: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  scheduleContent: {
    flex: 1,
  },
  dayName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnoName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  separator: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    marginHorizontal: spacing.xs,
  },
  hora: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  itemSeparator: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginLeft: 56, // Align with content after indicator
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },
});
