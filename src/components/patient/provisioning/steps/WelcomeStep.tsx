import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../../theme/tokens';
import { useWizardContext } from '../WizardContext';
import { announceForAccessibility } from '../../../../utils/accessibility';

/**
 * WelcomeStep Component
 * 
 * First step of the device provisioning wizard. Provides an overview
 * of the setup process.
 * 
 * Premium visual overhaul.
 */
export function WelcomeStep() {
  const { setCanProceed, onSkip } = useWizardContext();

  // Welcome step can always proceed
  useEffect(() => {
    setCanProceed(true);
    announceForAccessibility('Bienvenido al asistente de configuración del dispositivo');
  }, [setCanProceed]);

  const handleHelpPress = () => {
    Linking.openURL('https://support.example.com/device-setup');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroIconContainer}>
          <Ionicons name="hardware-chip" size={64} color={colors.primary[500]} />
          <View style={styles.heroIconBadge}>
            <Ionicons name="checkmark" size={20} color="white" />
          </View>
        </View>
        <Text style={styles.title}>¡Bienvenido a Pildhora!</Text>
        <Text style={styles.subtitle}>
          Vamos a configurar tu dispensador inteligente para que nunca olvides una toma.
        </Text>
      </View>

      {/* Time Estimate */}
      <View style={styles.timeEstimateContainer}>
        <Ionicons name="time-outline" size={20} color={colors.primary[600]} />
        <Text style={styles.timeEstimateText}>Tiempo estimado: 2 minutos</Text>
      </View>

      {/* Steps Preview Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lo que haremos:</Text>

        <View style={styles.stepsList}>
          <StepPreview
            number="1"
            title="Vincular"
            description="Ingresa el ID de tu dispositivo"
          />
          <View style={styles.stepConnector} />
          <StepPreview
            number="2"
            title="Conectar"
            description="Configura la red WiFi"
          />
          <View style={styles.stepConnector} />
          <StepPreview
            number="3"
            title="Personalizar"
            description="Ajusta tus preferencias"
          />
        </View>
      </View>

      {/* Checklist Card */}
      <View style={styles.checklistCard}>
        <Text style={styles.checklistTitle}>Antes de comenzar, asegúrate de:</Text>

        <ChecklistItem text="Tener tu dispositivo Pildhora encendido" />
        <ChecklistItem text="Estar cerca del dispositivo" />
        <ChecklistItem text="Conocer tu contraseña de WiFi" />
      </View>

      {/* Help & Skip Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={handleHelpPress}
          accessibilityRole="button"
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.helpButtonText}>¿Necesitas ayuda?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>Configurar más tarde</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StepPreview({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <View style={styles.stepPreview}>
      <View style={styles.stepNumberContainer}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <View style={styles.checklistItem}>
      <View style={styles.checkIcon}>
        <Ionicons name="checkmark-circle-outline" size={20} color={colors.success[500]} />
      </View>
      <Text style={styles.checklistText}>{text}</Text>
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
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  heroIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 40, // Squircle
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  heroIconBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
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
    lineHeight: 28,
  },
  timeEstimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // primary[500] with opacity
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  timeEstimateText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  stepsList: {
    gap: 0,
  },
  stepPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: colors.gray[200],
    marginLeft: 15, // Center with number container (32/2 - 1)
    marginVertical: 4,
  },
  checklistCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  checklistTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkIcon: {
    marginRight: spacing.sm,
  },
  checklistText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  actionsContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  helpButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
  skipButton: {
    padding: spacing.sm,
  },
  skipButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textDecorationLine: 'underline',
  },
});
