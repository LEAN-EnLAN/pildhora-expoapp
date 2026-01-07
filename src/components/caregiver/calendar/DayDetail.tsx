import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { IntakeRecord, IntakeStatus } from '../../../types';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

interface DayDetailProps {
  date: Date;
  records: IntakeRecord[];
  stats: {
    taken: number;
    missed: number;
    skipped: number;
    total: number;
  };
  loading?: boolean;
  onRecordPress: (record: IntakeRecord) => void;
}

// Helper to get status color
const getStatusColor = (status: IntakeStatus): string => {
  switch (status) {
    case IntakeStatus.TAKEN: return colors.success[500];
    case IntakeStatus.MISSED: return colors.error[500];
    case IntakeStatus.SKIPPED: return colors.warning[500];
    case IntakeStatus.PENDING: return colors.gray[400];
    default: return colors.gray[400];
  }
};

// Helper to get status label
const getStatusLabel = (status: IntakeStatus): string => {
  switch (status) {
    case IntakeStatus.TAKEN: return 'Tomada';
    case IntakeStatus.MISSED: return 'Olvidada';
    case IntakeStatus.SKIPPED: return 'Saltada';
    case IntakeStatus.PENDING: return 'Pendiente';
    default: return 'Desconocido';
  }
};

// Helper to get status icon
const getStatusIcon = (status: IntakeStatus): string => {
  switch (status) {
    case IntakeStatus.TAKEN: return 'checkmark-circle';
    case IntakeStatus.MISSED: return 'close-circle';
    case IntakeStatus.SKIPPED: return 'remove-circle';
    case IntakeStatus.PENDING: return 'time';
    default: return 'help-circle';
  }
};

// Intake Record Card Component
const IntakeRecordCard: React.FC<{ record: IntakeRecord; onPress: () => void }> = ({ record, onPress }) => {
  const scheduledTime = record.scheduledTime instanceof Object && 'toDate' in record.scheduledTime
    ? (record.scheduledTime as any).toDate()
    : new Date(record.scheduledTime as string | Date);

  return (
    <TouchableOpacity 
      style={styles.recordCard} 
      onPress={onPress}
      accessibilityLabel={`${record.medicationName}, ${getStatusLabel(record.status)}`}
      accessibilityHint="Toca para ver detalles del medicamento"
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordInfo}>
          <Text style={styles.medicationName}>{record.medicationName}</Text>
          <Text style={styles.dosageText}>{record.dosage}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(record.status) as any} 
            size={16} 
            color={getStatusColor(record.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
            {getStatusLabel(record.status)}
          </Text>
        </View>
      </View>
      <View style={styles.recordFooter}>
        <Ionicons name="time-outline" size={14} color={colors.gray[400]} />
        <Text style={styles.timeText}>
          {format(scheduledTime, 'HH:mm')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const DayDetail: React.FC<DayDetailProps> = ({
  date,
  records,
  stats,
  loading = false,
  onRecordPress,
}) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.dateTitle}>
        {format(date, "EEEE, d 'de' MMMM", { locale: es })}
      </Text>
      
      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success[600] }]} testID="stats-taken">
            {stats.taken}
          </Text>
          <Text style={styles.statLabel}>Tomadas</Text>
        </View>
        <View style={styles.statSeparator} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.error[600] }]} testID="stats-missed">
            {stats.missed}
          </Text>
          <Text style={styles.statLabel}>Olvidadas</Text>
        </View>
        <View style={styles.statSeparator} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning[600] }]} testID="stats-skipped">
            {stats.skipped}
          </Text>
          <Text style={styles.statLabel}>Saltadas</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
      <Text style={styles.emptyText}>No hay registros para este día</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando registros...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={records}
        renderItem={({ item }) => (
          <IntakeRecordCard 
            record={item} 
            onPress={() => onRecordPress(item)} 
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    padding: spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textTransform: 'capitalize',
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    height: 24,
    backgroundColor: colors.gray[200],
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.gray[500],
    marginTop: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.gray[500],
  },
  // IntakeRecordCard styles
  recordCard: {
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recordInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  medicationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: 2,
  },
  dosageText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  recordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
});
