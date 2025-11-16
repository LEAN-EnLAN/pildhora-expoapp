import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getDbInstance } from '../../../src/services/firebase';
import { RootState } from '../../../src/store';
import { MedicationEvent, Patient } from '../../../src/types';
import { Button, Container, Card } from '../../../src/components/ui';
import { EventTypeBadge } from '../../../src/components/caregiver/EventTypeBadge';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/theme/tokens';
import { getRelativeTimeString } from '../../../src/utils/dateUtils';

/**
 * Event Detail Screen
 * 
 * Displays comprehensive information about a medication event including:
 * - Full medication snapshot at time of event
 * - Change diff for update events
 * - Patient contact information
 * - Action buttons for viewing medication and contacting patient
 */
export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [event, setEvent] = useState<MedicationEvent | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load event and patient data
   */
  useEffect(() => {
    if (!id || !user?.id) {
      setError('Información de evento no disponible');
      setLoading(false);
      return;
    }

    const loadEventData = async () => {
      try {
        const db = await getDbInstance();
        if (!db) {
          throw new Error('Base de datos no disponible');
        }

        // Load event document
        const eventDoc = await getDoc(doc(db, 'medicationEvents', id));
        
        if (!eventDoc.exists()) {
          throw new Error('Evento no encontrado');
        }

        const eventData = eventDoc.data();
        
        // Verify caregiver access
        if (eventData.caregiverId !== user.id) {
          throw new Error('No tienes permiso para ver este evento');
        }

        const loadedEvent: MedicationEvent = {
          id: eventDoc.id,
          eventType: eventData.eventType,
          medicationId: eventData.medicationId,
          medicationName: eventData.medicationName,
          medicationData: eventData.medicationData,
          patientId: eventData.patientId,
          patientName: eventData.patientName,
          caregiverId: eventData.caregiverId,
          timestamp: eventData.timestamp?.toDate?.()?.toISOString() || eventData.timestamp,
          syncStatus: eventData.syncStatus,
          changes: eventData.changes,
        };

        setEvent(loadedEvent);

        // Load patient information
        const patientsQuery = query(
          collection(db, 'patients'),
          where('caregiverId', '==', user.id)
        );
        
        const patientsSnapshot = await getDocs(patientsQuery);
        const patientDoc = patientsSnapshot.docs.find(doc => doc.id === eventData.patientId);
        
        if (patientDoc) {
          const patientData = patientDoc.data();
          setPatient({
            id: patientDoc.id,
            name: patientData.name,
            email: patientData.email,
            caregiverId: patientData.caregiverId,
            createdAt: patientData.createdAt?.toDate?.()?.toISOString() || patientData.createdAt,
            deviceId: patientData.deviceId,
            adherence: patientData.adherence,
            lastTaken: patientData.lastTaken,
          });
        }

        setLoading(false);
      } catch (err: any) {
        console.error('[EventDetailScreen] Error loading event:', err);
        setError(err.message || 'Error al cargar el evento');
        setLoading(false);
      }
    };

    loadEventData();
  }, [id, user?.id]);

  /**
   * Navigate to patient's medication list
   */
  const handleViewMedication = () => {
    if (!event) return;

    router.push({
      pathname: '/caregiver/medications/[patientId]',
      params: { patientId: event.patientId },
    });
  };

  /**
   * Contact patient via email or phone
   */
  const handleContactPatient = () => {
    if (!patient) return;

    Alert.alert(
      'Contactar Paciente',
      `¿Cómo deseas contactar a ${patient.name}?`,
      [
        {
          text: 'Email',
          onPress: () => {
            const emailUrl = `mailto:${patient.email}`;
            Linking.openURL(emailUrl).catch(err => {
              console.error('[EventDetailScreen] Error opening email:', err);
              Alert.alert('Error', 'No se pudo abrir el cliente de correo');
            });
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <Container style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Cargando evento...</Text>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  /**
   * Render error state
   */
  if (error || !event) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <Container style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error[500]} />
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorMessage}>{error || 'Evento no encontrado'}</Text>
            <Button
              variant="primary"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              Volver
            </Button>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Container style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Header */}
          <EventHeader event={event} />

          {/* Change Diff (for update events) */}
          {event.eventType === 'updated' && event.changes && event.changes.length > 0 && (
            <ChangeDiffSection changes={event.changes} />
          )}

          {/* Medication Snapshot */}
          <MedicationSnapshotSection medicationData={event.medicationData} />

          {/* Patient Contact Information */}
          {patient && <PatientContactSection patient={patient} />}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              variant="primary"
              onPress={handleViewMedication}
              style={styles.actionButton}
              leftIcon={<Ionicons name="medical-outline" size={20} color="#FFFFFF" />}
              accessibilityLabel={`Ver lista de medicamentos de ${event.patientName}`}
              accessibilityHint="Navega a la lista de medicamentos del paciente"
            >
              Ver Medicamentos
            </Button>
            
            {patient && (
              <Button
                variant="secondary"
                onPress={handleContactPatient}
                style={styles.actionButton}
                leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary[500]} />}
                accessibilityLabel={`Contactar a ${patient.name}`}
                accessibilityHint="Abre opciones para contactar al paciente por email"
              >
                Contactar Paciente
              </Button>
            )}
          </View>
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
}

/**
 * Event Header Component
 */
function EventHeader({ event }: { event: MedicationEvent }) {
  const iconConfig = getEventTypeIcon(event.eventType);
  const eventTypeText = getEventTypeText(event.eventType);
  const relativeTime = getRelativeTimeString(event.timestamp);

  return (
    <Card 
      variant="elevated" 
      padding="lg" 
      style={styles.headerCard}
      accessibilityLabel={`${event.patientName} ${eventTypeText.toLowerCase()} ${event.medicationName} ${relativeTime}`}
    >
      <View style={styles.headerBadgeContainer}>
        <EventTypeBadge eventType={event.eventType as any} size="lg" />
      </View>
      
      <View style={styles.headerContent}>
        <View 
          style={[styles.headerIcon, { backgroundColor: iconConfig.backgroundColor }]}
          accessibilityLabel={`Tipo de evento: ${eventTypeText}`}
        >
          <Ionicons name={iconConfig.name as any} size={32} color={iconConfig.color} />
        </View>
        
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} accessibilityRole="text">
            {event.patientName} {eventTypeText.toLowerCase()}
          </Text>
          <Text style={styles.headerMedication} accessibilityRole="text">"{event.medicationName}"</Text>
          <View style={styles.headerTimestamp}>
            <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
            <Text style={styles.timestampText} accessibilityLabel={`Hace ${relativeTime}`}>
              {relativeTime}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

/**
 * Change Diff Section Component with Timeline View
 */
function ChangeDiffSection({ changes }: { changes: any[] }) {
  return (
    <Card 
      variant="elevated" 
      padding="lg" 
      style={styles.section}
      accessibilityLabel={`Cambios realizados: ${changes.length} modificaciones`}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name="git-compare-outline" size={24} color={colors.primary[500]} />
        </View>
        <Text style={styles.sectionTitle}>Cambios Realizados</Text>
      </View>
      
      <View style={styles.timelineContainer}>
        {changes.map((change, index) => (
          <ChangeTimelineItem 
            key={index} 
            change={change} 
            isLast={index === changes.length - 1}
          />
        ))}
      </View>
    </Card>
  );
}

/**
 * Timeline Change Item Component
 */
function ChangeTimelineItem({ change, isLast }: { change: any; isLast: boolean }) {
  const fieldLabel = getFieldLabel(change.field);
  const oldValueFormatted = formatValue(change.oldValue);
  const newValueFormatted = formatValue(change.newValue);

  return (
    <View 
      style={styles.timelineItem}
      accessibilityLabel={`${fieldLabel} cambió de ${oldValueFormatted} a ${newValueFormatted}`}
      accessibilityRole="text"
    >
      {/* Timeline connector */}
      <View style={styles.timelineConnector}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      
      {/* Change content */}
      <View style={styles.timelineContent}>
        <Text style={styles.changeField}>{fieldLabel}</Text>
        <View style={styles.changeValues}>
          <View style={styles.oldValue}>
            <Text style={styles.valueLabel}>Anterior</Text>
            <Text style={styles.oldValueText} accessibilityLabel={`Valor anterior: ${oldValueFormatted}`}>
              {oldValueFormatted}
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={20} color={colors.primary[500]} />
          </View>
          <View style={styles.newValue}>
            <Text style={styles.valueLabel}>Nuevo</Text>
            <Text style={styles.newValueText} accessibilityLabel={`Valor nuevo: ${newValueFormatted}`}>
              {newValueFormatted}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Medication Snapshot Section Component
 */
function MedicationSnapshotSection({ medicationData }: { medicationData: any }) {
  if (!medicationData) {
    return null;
  }

  return (
    <Card 
      variant="elevated" 
      padding="lg" 
      style={styles.section}
      accessibilityLabel="Información completa del medicamento"
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary[500]} />
        </View>
        <Text style={styles.sectionTitle}>Información del Medicamento</Text>
      </View>
      
      <View style={styles.snapshotContainer}>
        {medicationData.emoji && (
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotIconContainer}>
              <Ionicons name="happy-outline" size={18} color={colors.gray[500]} />
            </View>
            <Text style={styles.snapshotLabel}>Icono:</Text>
            <Text style={styles.snapshotValue}>{medicationData.emoji}</Text>
          </View>
        )}
        
        <View style={styles.snapshotRow}>
          <View style={styles.snapshotIconContainer}>
            <Ionicons name="medical-outline" size={18} color={colors.gray[500]} />
          </View>
          <Text style={styles.snapshotLabel}>Nombre:</Text>
          <Text style={styles.snapshotValue}>{medicationData.name}</Text>
        </View>
        
        {medicationData.doseValue && (
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotIconContainer}>
              <Ionicons name="water-outline" size={18} color={colors.gray[500]} />
            </View>
            <Text style={styles.snapshotLabel}>Dosis:</Text>
            <Text style={styles.snapshotValue}>
              {medicationData.doseValue} {medicationData.doseUnit || ''}
            </Text>
          </View>
        )}
        
        {medicationData.quantityType && (
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotIconContainer}>
              <Ionicons name="cube-outline" size={18} color={colors.gray[500]} />
            </View>
            <Text style={styles.snapshotLabel}>Tipo:</Text>
            <Text style={styles.snapshotValue}>{medicationData.quantityType}</Text>
          </View>
        )}
        
        {medicationData.times && medicationData.times.length > 0 && (
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotIconContainer}>
              <Ionicons name="time-outline" size={18} color={colors.gray[500]} />
            </View>
            <Text style={styles.snapshotLabel}>Horarios:</Text>
            <Text style={styles.snapshotValue}>{medicationData.times.join(', ')}</Text>
          </View>
        )}
        
        {medicationData.frequency && (
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotIconContainer}>
              <Ionicons name="repeat-outline" size={18} color={colors.gray[500]} />
            </View>
            <Text style={styles.snapshotLabel}>Frecuencia:</Text>
            <Text style={styles.snapshotValue}>{medicationData.frequency}</Text>
          </View>
        )}
        
        {medicationData.trackInventory && (
          <>
            <View style={styles.snapshotRow}>
              <View style={styles.snapshotIconContainer}>
                <Ionicons name="layers-outline" size={18} color={colors.gray[500]} />
              </View>
              <Text style={styles.snapshotLabel}>Inventario:</Text>
              <Text style={styles.snapshotValue}>
                {medicationData.currentQuantity ?? 'N/A'} unidades
              </Text>
            </View>
            
            {medicationData.lowQuantityThreshold && (
              <View style={styles.snapshotRow}>
                <View style={styles.snapshotIconContainer}>
                  <Ionicons name="warning-outline" size={18} color={colors.gray[500]} />
                </View>
                <Text style={styles.snapshotLabel}>Umbral bajo:</Text>
                <Text style={styles.snapshotValue}>
                  {medicationData.lowQuantityThreshold} unidades
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </Card>
  );
}

/**
 * Patient Contact Section Component
 */
function PatientContactSection({ patient }: { patient: Patient }) {
  return (
    <Card 
      variant="elevated" 
      padding="lg" 
      style={styles.section}
      accessibilityLabel={`Información de contacto de ${patient.name}`}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name="person-outline" size={24} color={colors.primary[500]} />
        </View>
        <Text style={styles.sectionTitle}>Información del Paciente</Text>
      </View>
      
      <View style={styles.contactContainer}>
        <View style={styles.contactRow}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="person" size={20} color={colors.primary[500]} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Nombre</Text>
            <Text style={styles.contactValue}>{patient.name}</Text>
          </View>
        </View>
        
        <View style={styles.contactRow}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="mail" size={20} color={colors.primary[500]} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{patient.email}</Text>
          </View>
        </View>
        
        {patient.adherence !== undefined && (
          <View style={styles.contactRow}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="stats-chart" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Adherencia</Text>
              <Text style={styles.contactValue}>{patient.adherence}%</Text>
            </View>
          </View>
        )}
        
        {patient.lastTaken && (
          <View style={styles.contactRow}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="time" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Última dosis</Text>
              <Text style={styles.contactValue}>{patient.lastTaken}</Text>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

/**
 * Helper Functions
 */

function getEventTypeIcon(eventType: string): { name: string; color: string; backgroundColor: string } {
  switch (eventType) {
    case 'created':
      return {
        name: 'add-circle',
        color: colors.success,
        backgroundColor: '#E6F7ED',
      };
    case 'updated':
      return {
        name: 'create',
        color: colors.primary[500],
        backgroundColor: colors.primary[50],
      };
    case 'deleted':
      return {
        name: 'trash',
        color: colors.error[500],
        backgroundColor: colors.error[50],
      };
    default:
      return {
        name: 'information-circle',
        color: colors.info,
        backgroundColor: '#F0EFFF',
      };
  }
}

function getEventTypeText(eventType: string): string {
  switch (eventType) {
    case 'created':
      return 'Creó';
    case 'updated':
      return 'Actualizó';
    case 'deleted':
      return 'Eliminó';
    default:
      return 'Modificó';
  }
}

function getFieldLabel(field: string): string {
  const fieldLabels: Record<string, string> = {
    name: 'Nombre',
    doseValue: 'Valor de dosis',
    doseUnit: 'Unidad',
    quantityType: 'Tipo',
    times: 'Horarios',
    frequency: 'Frecuencia',
    emoji: 'Icono',
    currentQuantity: 'Cantidad actual',
    lowQuantityThreshold: 'Umbral bajo',
    trackInventory: 'Seguimiento de inventario',
  };
  
  return fieldLabels[field] || field;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  
  return String(value);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.error[500],
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.lg,
  },
  headerCard: {
    marginBottom: spacing.md,
  },
  headerBadgeContainer: {
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  headerMedication: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[700],
    fontStyle: 'italic',
  },
  headerTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  timestampText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  timelineContainer: {
    gap: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineConnector: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
    borderWidth: 3,
    borderColor: colors.primary[100],
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primary[100],
    marginTop: spacing.xs,
  },
  timelineContent: {
    flex: 1,
    gap: spacing.sm,
  },
  changeField: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeValues: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  valueLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  oldValue: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error[500],
  },
  oldValueText: {
    fontSize: typography.fontSize.base,
    color: colors.error[500],
    fontWeight: typography.fontWeight.medium,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  newValue: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  newValueText: {
    fontSize: typography.fontSize.base,
    color: '#059669',
    fontWeight: typography.fontWeight.medium,
  },
  snapshotContainer: {
    gap: spacing.md,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  snapshotIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
    width: 100,
  },
  snapshotValue: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: typography.fontWeight.medium,
  },
  contactContainer: {
    gap: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  contactLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[500],
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: typography.fontWeight.medium,
  },
  actionButtons: {
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
});
