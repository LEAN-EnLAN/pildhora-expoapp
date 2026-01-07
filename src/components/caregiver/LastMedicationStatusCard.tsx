import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EventTypeBadge } from './EventTypeBadge';
import { AutonomousModeBanner } from './AutonomousModeBanner';
import { colors, spacing, typography } from '../../theme/tokens';
import { MedicationEvent, LastMedicationStatusCardProps } from '../../types';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { useCollectionSWR } from '../../hooks/useCollectionSWR';
import { usePatientAutonomousMode } from '../../hooks/usePatientAutonomousMode';
import { getDbInstance } from '../../services/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * LastMedicationStatusCard Component
 * 
 * Displays the most recent medication event for a patient using the same
 * SWR pattern as the events tab for consistency and reliability.
 * 
 * Features:
 * - Uses useCollectionSWR for data fetching (same as events tab)
 * - Queries by patientId (primary field in medicationEvents)
 * - Matches dashboard card styling (elevated card with header)
 * - Skeleton loading state
 * - Empty state with helpful message
 * - Error handling with retry
 * 
 * @param {LastMedicationStatusCardProps} props - Component props
 * @returns {JSX.Element} Rendered card component
 */
export const LastMedicationStatusCard: React.FC<LastMedicationStatusCardProps> = ({
  patientId,
  caregiverId,
  onViewAll,
}) => {
  const router = useRouter();
  
  // Check if patient is in autonomous mode
  const { isAutonomous } = usePatientAutonomousMode(patientId);

  /**
   * Build Firestore query for latest event
   * Uses same pattern as events tab
   */
  const [eventsQuery, setEventsQuery] = React.useState<any>(null);

  React.useEffect(() => {
    if (!patientId) {
      setEventsQuery(null);
      return;
    }

    const buildQuery = async () => {
      const db = await getDbInstance();
      if (!db) {
        setEventsQuery(null);
        return;
      }

      const q = query(
        collection(db, 'medicationEvents'),
        where('patientId', '==', patientId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      setEventsQuery(q);
    };

    buildQuery();
  }, [patientId]);

  /**
   * Fetch latest event using SWR pattern
   * Same hook used by events tab for consistency
   */
  const {
    data: events,
    isLoading: loading,
    error,
    mutate: refetch,
  } = useCollectionSWR<MedicationEvent>({
    cacheKey: patientId ? `last_event:${patientId}` : null,
    query: eventsQuery,
    initialData: [],
    realtime: false,
    cacheTTL: 2 * 60 * 1000, // 2 minutes cache
  });

  // Get the first (and only) event
  const event = events && events.length > 0 ? events[0] : null;

  /**
   * Handle view all events navigation
   */
  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push('/caregiver/events');
    }
  }, [onViewAll, router]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Render loading skeleton
   */
  if (loading) {
    return (
      <Card variant="elevated" padding="none">
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={24} color={colors.primary[600]} />
              </View>
              <View>
                <Text style={styles.title}>Último Evento</Text>
                <Text style={styles.subtitle}>Actividad reciente</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonText} />
          <View style={[styles.skeletonText, { width: '60%' }]} />
        </View>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Card variant="elevated" padding="none">
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="alert-circle" size={24} color={colors.error[600]} />
              </View>
              <View>
                <Text style={styles.title}>Último Evento</Text>
                <Text style={styles.subtitle}>Error al cargar</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              No se pudo cargar el último evento
            </Text>
            <Button
              variant="outline"
              size="sm"
              onPress={handleRetry}
              style={styles.retryButton}
            >
              Reintentar
            </Button>
          </View>
        </View>
      </Card>
    );
  }

  /**
   * Render empty state
   */
  if (!event) {
    return (
      <Card variant="elevated" padding="none">
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={24} color={colors.gray[400]} />
              </View>
              <View>
                <Text style={styles.title}>Último Evento</Text>
                <Text style={styles.subtitle}>Sin actividad</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.content}>
          {isAutonomous ? (
            <AutonomousModeBanner 
              message="Modo autónomo activado - No hay datos recientes disponibles"
              size="md"
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No hay eventos recientes</Text>
              <Text style={styles.emptySubtext}>
                Los eventos de medicamentos aparecerán aquí
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  }

  /**
   * Render event data
   */
  const relativeTime = getRelativeTimeString(event.timestamp);

  return (
    <Card variant="elevated" padding="none">
      {/* Header with gradient background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={24} color={colors.primary[600]} />
            </View>
            <View>
              <Text style={styles.title}>Último Evento</Text>
              <Text style={styles.subtitle}>Actividad reciente</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Event content */}
      <View style={styles.content}>
        {/* Event type badge */}
        <EventTypeBadge eventType={event.eventType} size="md" />

        {/* Medication name */}
        <View style={styles.medicationRow}>
          <Ionicons name="medical" size={18} color={colors.gray[600]} />
          <Text style={styles.medicationName} numberOfLines={2}>
            {event.medicationName}
          </Text>
        </View>

        {/* Patient name (if available and different from selected patient) */}
        {event.patientName && (
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color={colors.gray[500]} />
            <Text style={styles.infoText} numberOfLines={1}>
              {event.patientName}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        <View style={styles.infoRow}>
          <Ionicons name="time" size={16} color={colors.gray[500]} />
          <Text style={styles.infoText}>{relativeTime}</Text>
        </View>

        {/* View All button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="ghost"
            size="sm"
            onPress={handleViewAll}
            rightIcon={<Ionicons name="arrow-forward" size={16} color={colors.primary[500]} />}
            accessibilityLabel="Ver todos los eventos"
            accessibilityHint="Navega a la pantalla de registro de eventos"
          >
            Ver Todos los Eventos
          </Button>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  medicationName: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  buttonContainer: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[600],
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error[500],
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  // Skeleton styles
  skeletonBadge: {
    width: 120,
    height: 32,
    backgroundColor: colors.gray[200],
    borderRadius: 16,
  },
  skeletonText: {
    width: '80%',
    height: 20,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
  },
});
