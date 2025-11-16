import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { EventTypeBadge } from './EventTypeBadge';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';
import { MedicationEvent, LastMedicationStatusCardProps } from '../../types';
import { getRelativeTimeString } from '../../utils/dateUtils';
import { getDbInstance } from '../../services/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * LastMedicationStatusCard Component
 * 
 * Displays the most recent medication event for a patient.
 * Shows event type badge, medication name, timestamp, and "View All Events" button.
 * Includes loading skeleton for initial data fetch.
 * 
 * @param {LastMedicationStatusCardProps} props - Component props
 * @returns {JSX.Element} Rendered card component
 * 
 * @example
 * <LastMedicationStatusCard
 *   patientId="patient123"
 *   caregiverId="caregiver456"
 *   onViewAll={() => router.push('/caregiver/events')}
 * />
 */
export const LastMedicationStatusCard: React.FC<LastMedicationStatusCardProps> = ({
  patientId,
  caregiverId,
  onViewAll,
}) => {
  const [event, setEvent] = useState<MedicationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fade-in animation for content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Clear previous event when patient changes
    setEvent(null);
    setError(null);

    fetchLastEvent();
  }, [patientId, caregiverId]);

  /**
   * Fetch the most recent medication event from Firestore
   */
  const fetchLastEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      const db = await getDbInstance();
      if (!db) {
        throw new Error('Firestore no disponible');
      }

      // Build query based on available filters
      const constraints = [];
      
      if (caregiverId) {
        constraints.push(where('caregiverId', '==', caregiverId));
      }
      
      if (patientId) {
        constraints.push(where('patientId', '==', patientId));
      }

      // If no filters provided, we can't query
      if (constraints.length === 0) {
        setEvent(null);
        setLoading(false);
        return;
      }

      constraints.push(orderBy('timestamp', 'desc'));
      constraints.push(limit(1));

      const eventsQuery = query(
        collection(db, 'medicationEvents'),
        ...constraints
      );

      const snapshot = await getDocs(eventsQuery);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        const eventData = {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
        } as MedicationEvent;
        
        setEvent(eventData);
        
        // Fade in content when data loads
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        setEvent(null);
      }
    } catch (err: any) {
      console.error('[LastMedicationStatusCard] Error fetching event:', err);
      setError(err.message || 'Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render loading skeleton
   */
  if (loading) {
    return (
      <Card variant="outlined" padding="md">
        <View style={styles.container}>
          <View style={styles.header}>
            <SkeletonLoader width={120} height={24} style={{ marginBottom: spacing.sm }} />
          </View>
          <View style={styles.content}>
            <SkeletonLoader width="60%" height={32} borderRadius={borderRadius.full} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader width="80%" height={20} style={{ marginBottom: spacing.xs }} />
            <SkeletonLoader width="50%" height={16} />
          </View>
        </View>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Card variant="outlined" padding="md">
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
            <Text style={styles.title}>Último Evento</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              variant="outline"
              size="sm"
              onPress={fetchLastEvent}
              style={{ marginTop: spacing.md }}
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
      <Card variant="outlined" padding="md">
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="time-outline" size={20} color={colors.gray[500]} />
            <Text style={styles.title}>Último Evento</Text>
          </View>
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No hay eventos recientes</Text>
            <Text style={styles.emptySubtext}>
              Los eventos de medicamentos aparecerán aquí
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  /**
   * Render event data
   */
  const relativeTime = getRelativeTimeString(event.timestamp);

  return (
    <Card variant="outlined" padding="md">
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="time-outline" size={20} color={colors.primary[500]} />
          <Text style={styles.title}>Último Evento</Text>
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

          {/* Patient name (if available) */}
          {event.patientName && (
            <View style={styles.patientRow}>
              <Ionicons name="person" size={16} color={colors.gray[500]} />
              <Text style={styles.patientName} numberOfLines={1}>
                {event.patientName}
              </Text>
            </View>
          )}

          {/* Timestamp */}
          <View style={styles.timestampRow}>
            <Ionicons name="time" size={16} color={colors.gray[500]} />
            <Text style={styles.timestamp}>{relativeTime}</Text>
          </View>
        </View>

        {/* View All button */}
        {onViewAll && (
          <View style={styles.footer}>
            <Button
              variant="ghost"
              size="sm"
              onPress={onViewAll}
              rightIcon={<Ionicons name="arrow-forward" size={16} color={colors.primary[500]} />}
              accessibilityLabel="Ver todos los eventos"
              accessibilityHint="Navega a la pantalla de registro de eventos"
            >
              Ver Todos los Eventos
            </Button>
          </View>
        )}
      </Animated.View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  content: {
    gap: spacing.md,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medicationName: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[800],
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  patientName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timestamp: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  footer: {
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
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error[500],
    textAlign: 'center',
  },
});
