import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';
import { useWizardContext } from '../WizardContext';
import { announceForAccessibility, triggerHapticFeedback, HapticFeedbackType } from '../../../../utils/accessibility';
import { completeOnboarding } from '../../../../services/onboarding';
import { Button } from '../../../ui';

/**
 * CompletionStep Component
 * 
 * Sixth and final step of the device provisioning wizard. Shows success
 * message and summary.
 * 
 * Premium visual overhaul.
 */
export function CompletionStep() {
  const router = useRouter();
  const { formData, setCanProceed, userId } = useWizardContext();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  useEffect(() => {
    announceForAccessibility('Paso 6: Configuración completada exitosamente');
    markOnboardingComplete();
  }, []);

  /**
   * Mark onboarding as complete
   */
  const markOnboardingComplete = async () => {
    setIsCompleting(true);

    try {
      await completeOnboarding(userId);

      setCanProceed(true);
      await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
      announceForAccessibility('Configuración completada. Tu dispositivo está listo para usar');

    } catch (error: any) {
      console.error('[CompletionStep] Error completing onboarding:', error);

      let userMessage = 'Error al completar la configuración';
      if (error.code === 'permission-denied') userMessage = 'No tienes permiso para completar la configuración';

      setCompletionError(userMessage);
      setCanProceed(false);
      await triggerHapticFeedback(HapticFeedbackType.ERROR);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGoToHome = async () => {
    await triggerHapticFeedback(HapticFeedbackType.SUCCESS);
    router.replace('/patient/home');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Header */}
      <View style={styles.header}>
        <View style={styles.successIconContainer}>
          <Ionicons name="trophy" size={64} color="#F59E0B" />
          <View style={styles.confettiIcon}>
            <Ionicons name="sparkles" size={32} color="#FCD34D" />
          </View>
        </View>
        <Text style={styles.title}>¡Felicitaciones!</Text>
        <Text style={styles.subtitle}>
          Tu dispositivo Pildhora está listo para cuidar de ti.
        </Text>
      </View>

      {/* Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen de tu dispositivo</Text>

        <View style={styles.summaryGrid}>
          <SummaryItem
            icon="hardware-chip-outline"
            label="ID"
            value={formData.deviceId}
          />
          <SummaryItem
            icon="wifi-outline"
            label="Red WiFi"
            value={formData.wifiSSID || 'No configurada'}
          />
          <SummaryItem
            icon="notifications-outline"
            label="Alarma"
            value={getAlarmModeLabel(formData.alarmMode)}
          />
          <SummaryItem
            icon="bulb-outline"
            label="LED"
            value={`${formData.ledIntensity}%`}
          />
        </View>
      </View>

      {/* Next Steps */}
      <View style={styles.nextStepsSection}>
        <Text style={styles.sectionTitle}>¿Qué sigue?</Text>

        <View style={styles.stepCard}>
          <View style={styles.stepIconContainer}>
            <Ionicons name="medical" size={24} color={colors.primary[500]} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Agrega tus medicamentos</Text>
            <Text style={styles.stepDescription}>
              Configura tus horarios y dosis en la siguiente pantalla.
            </Text>
          </View>
        </View>
      </View>

      {/* Error Display */}
      {completionError && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
          <Text style={styles.errorText}>{completionError}</Text>
        </View>
      )}

      {/* Navigation Button */}
      {!completionError && (
        <View style={styles.navigationSection}>
          <Button
            onPress={handleGoToHome}
            variant="primary"
            size="lg"
            disabled={isCompleting}
            loading={isCompleting}
            style={styles.mainButton}
          >
            Comenzar a usar Pildhora
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

function getAlarmModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    sound: 'Sonido',
    vibrate: 'Vibración',
    both: 'Ambos',
    silent: 'Silencio',
  };
  return labels[mode] || mode;
}

function SummaryItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap, label: string, value: string }) {
  return (
    <View style={styles.summaryItem}>
      <View style={styles.summaryIconWrapper}>
        <Ionicons name={icon} size={18} color={colors.primary[600]} />
      </View>
      <View>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: '#FEF3C7', // amber[100]
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  confettiIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  summaryIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  nextStepsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error[500],
  },
  navigationSection: {
    marginTop: spacing.sm,
  },
  mainButton: {
    borderRadius: borderRadius.full,
    height: 56,
  },
});
