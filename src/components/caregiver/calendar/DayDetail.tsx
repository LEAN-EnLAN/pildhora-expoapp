import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { MedicationEvent } from '../../../types';
import { MedicationEventCard } from '../MedicationEventCard';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

interface DayDetailProps {
  date: Date;
  events: MedicationEvent[];
  stats: {
    taken: number;
    missed: number;
    skipped: number;
    total: number;
  };
  loading?: boolean;
  onEventPress: (event: MedicationEvent) => void;
}

export const DayDetail: React.FC<DayDetailProps> = ({
  date,
  events,
  stats,
  loading = false,
  onEventPress,
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
      <Text style={styles.emptyText}>No hay eventos para este día</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={events}
        renderItem={({ item }) => (
          <MedicationEventCard 
            event={item} 
            onPress={() => onEventPress(item)} 
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
});
