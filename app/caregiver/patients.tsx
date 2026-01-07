import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../src/store';
import { Button, Container, Card, AnimatedListItem } from '../../src/components/ui';
import { ScreenWrapper } from '../../src/components/caregiver';
import { useLinkedPatients } from '../../src/hooks/useLinkedPatients';
import { unlinkPatientFromCaregiver } from '../../src/services/caregiverPatientLinks';
import { useScrollViewPadding } from '../../src/hooks/useScrollViewPadding';
import { colors, spacing, typography, borderRadius } from '../../src/theme/tokens';

/**
 * PatientsScreen
 * 
 * CRUD interface for caregivers to manage their linked patients:
 * 1. View all linked patients
 * 2. Add new patients via connection code
 * 3. View patient details
 * 4. Manage patient medications
 * 5. Unlink patients
 */
export default function PatientsScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Layout dimensions for proper spacing
  const { contentPaddingBottom } = useScrollViewPadding();
  
  // Fetch linked patients from backend
  const { 
    patients, 
    isLoading: loadingPatients,
    error: patientsError,
    refetch 
  } = useLinkedPatients({
    caregiverId: user?.id || null,
    enabled: !!user?.id,
  });

  /**
   * Navigate to add patient screen (connection code)
   */
  const handleAddPatient = useCallback(() => {
    router.push('/caregiver/device-connection');
  }, [router]);

  /**
   * Navigate to patient medications
   */
  const handleManagePatient = useCallback((patientId: string) => {
    router.push(`/caregiver/medications/${patientId}`);
  }, [router]);

  /**
   * View patient details
   */
  const handleViewPatient = useCallback((patientId: string) => {
    // TODO: Navigate to patient detail screen
    router.push(`/caregiver/medications/${patientId}`);
  }, [router]);

  /**
   * Unlink patient
   */
  const handleUnlinkPatient = useCallback((patientId: string, patientName: string) => {
    Alert.alert(
      'Desvincular Paciente',
      `¿Estás seguro de que deseas desvincular a ${patientName}? Perderás acceso a sus medicamentos y eventos.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) {
              Alert.alert('Error', 'Error de autenticación. Por favor, inicia sesión nuevamente.');
              return;
            }

            try {
              await unlinkPatientFromCaregiver(user.id, patientId);
              Alert.alert('Éxito', 'Paciente desvinculado correctamente');
              refetch();
            } catch (error: any) {
              console.error('[PatientsScreen] Error unlinking patient:', error);
              Alert.alert(
                'Error',
                error.userMessage || 'No se pudo desvincular el paciente. Por favor, intenta nuevamente.'
              );
            }
          },
        },
      ]
    );
  }, [user?.id, refetch]);

  return (
    <ScreenWrapper>
      <Container style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.title}>Mis Pacientes</Text>
                <Text style={styles.subtitle}>
                  {patients.length} {patients.length === 1 ? 'paciente vinculado' : 'pacientes vinculados'}
                </Text>
              </View>
              <Button
                variant="primary"
                size="md"
                onPress={handleAddPatient}
                leftIcon={<Ionicons name="add" size={20} color={colors.surface} />}
                accessibilityLabel="Agregar paciente"
                accessibilityHint="Abre la pantalla para vincular un nuevo paciente"
              >
                Agregar
              </Button>
            </View>
          </View>

          {/* Error State */}
          {patientsError && (
            <Card style={styles.errorCard}>
              <Ionicons name="alert-circle" size={48} color={colors.error[500]} />
              <Text style={styles.errorText}>Error al cargar pacientes</Text>
              <Text style={styles.errorSubtext}>{patientsError.message}</Text>
              <Button
                variant="outline"
                size="sm"
                onPress={refetch}
                style={styles.retryButton}
              >
                Reintentar
              </Button>
            </Card>
          )}

          {/* Loading State */}
          {loadingPatients && !patientsError && (
            <Card style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Cargando pacientes...</Text>
            </Card>
          )}

          {/* Empty State */}
          {!loadingPatients && !patientsError && patients.length === 0 && (
            <Card style={styles.emptyCard}>
              <Ionicons
                name="people-outline"
                size={64}
                color={colors.gray[300]}
              />
              <Text style={styles.emptyText}>No hay pacientes vinculados</Text>
              <Text style={styles.emptySubtext}>
                Agrega tu primer paciente usando un código de conexión
              </Text>
              <Button
                variant="primary"
                size="lg"
                onPress={handleAddPatient}
                style={styles.emptyButton}
                leftIcon={<Ionicons name="add" size={20} color={colors.surface} />}
              >
                Agregar Paciente
              </Button>
            </Card>
          )}

          {/* Patients List */}
          {!loadingPatients && !patientsError && patients.length > 0 && (
            <View style={styles.patientsList}>
              {patients.map((patient, index) => (
                <AnimatedListItem key={patient.id} index={index} delay={100}>
                  <Card style={styles.patientCard}>
                    <TouchableOpacity
                      style={styles.patientCardContent}
                      onPress={() => handleViewPatient(patient.id)}
                      accessibilityLabel={`Ver detalles de ${patient.name}`}
                      accessibilityRole="button"
                    >
                      <View style={styles.patientAvatar}>
                        <Ionicons
                          name="person"
                          size={28}
                          color={colors.primary[500]}
                        />
                      </View>
                      <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{patient.name}</Text>
                        <Text style={styles.patientEmail}>{patient.email}</Text>
                        {patient.deviceId && (
                          <View style={styles.deviceBadge}>
                            <Ionicons
                              name="hardware-chip-outline"
                              size={14}
                              color={colors.success[600]}
                            />
                            <Text style={styles.deviceText}>Dispositivo conectado</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={styles.patientActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleManagePatient(patient.id)}
                        accessibilityLabel={`Gestionar medicamentos de ${patient.name}`}
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name="medical-outline"
                          size={20}
                          color={colors.primary[600]}
                        />
                        <Text style={styles.actionButtonText}>Medicamentos</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={() => handleUnlinkPatient(patient.id, patient.name)}
                        accessibilityLabel={`Desvincular a ${patient.name}`}
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name="unlink-outline"
                          size={20}
                          color={colors.error[600]}
                        />
                        <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                          Desvincular
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </AnimatedListItem>
              ))}
            </View>
          )}

          {/* Help Section */}
          {!loadingPatients && patients.length > 0 && (
            <Card style={styles.helpCard}>
              <View style={styles.helpHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={colors.primary[500]}
                />
                <Text style={styles.helpTitle}>Gestión de Pacientes</Text>
              </View>

              <View style={styles.helpContent}>
                <View style={styles.helpItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={colors.gray[600]}
                  />
                  <Text style={styles.helpText}>
                    Toca un paciente para ver sus detalles
                  </Text>
                </View>

                <View style={styles.helpItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={colors.gray[600]}
                  />
                  <Text style={styles.helpText}>
                    Usa "Medicamentos" para gestionar sus tratamientos
                  </Text>
                </View>

                <View style={styles.helpItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={colors.gray[600]}
                  />
                  <Text style={styles.helpText}>
                    Desvincular un paciente no elimina sus datos
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </ScrollView>
      </Container>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  // Header
  header: {
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  // Error State
  errorCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[600],
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  // Loading State
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  // Empty State
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[600],
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  // Patients List
  patientsList: {
    gap: spacing.md,
  },
  patientCard: {
    padding: 0,
  },
  patientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  patientEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs - 2,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  deviceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.success[700],
  },
  // Patient Actions
  patientActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: spacing.sm,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  actionButtonDanger: {
    backgroundColor: colors.error[50],
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  actionButtonTextDanger: {
    color: colors.error[600],
  },
  // Help Card
  helpCard: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[100],
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  helpTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  helpContent: {
    gap: spacing.md,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  helpText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
