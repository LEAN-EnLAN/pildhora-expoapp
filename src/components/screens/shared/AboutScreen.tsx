/**
 * AboutScreen Component
 * 
 * Displays app information, version, and branding.
 * Can be used in both patient and caregiver settings.
 * 
 * @example
 * <AboutScreen />
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';
import AppIcon from '../../ui/AppIcon';
import { Card } from '../../ui/Card';
import Constants from 'expo-constants';

export interface AboutScreenProps {
  /** Optional callback when support is requested */
  onContactSupport?: () => void;
}

export default function AboutScreen({ onContactSupport }: AboutScreenProps) {
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const appName = Constants.expoConfig?.name || 'Pildhora';

  const handleWebsite = () => {
    Linking.openURL('https://pildhora.com');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@pildhora.com');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* App Branding */}
      <View style={styles.brandingSection}>
        <AppIcon size="2xl" showShadow={true} rounded={true} />
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.tagline}>Tu compañero inteligente para la gestión de medicamentos</Text>
        <Text style={styles.version}>Versión {appVersion}</Text>
      </View>

      {/* Features */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <Text style={styles.sectionTitle}>Características</Text>
        <View style={styles.featureList}>
          <FeatureItem
            icon="medical-outline"
            title="Gestión de Medicamentos"
            description="Organiza y rastrea todos tus medicamentos en un solo lugar"
          />
          <FeatureItem
            icon="notifications-outline"
            title="Recordatorios Inteligentes"
            description="Nunca olvides una dosis con nuestras alertas personalizadas"
          />
          <FeatureItem
            icon="hardware-chip-outline"
            title="Integración con Dispositivos"
            description="Conecta tu pastillero inteligente para automatización completa"
          />
          <FeatureItem
            icon="people-outline"
            title="Modo Cuidador"
            description="Los cuidadores pueden gestionar medicamentos de múltiples pacientes"
          />
        </View>
      </Card>

      {/* Contact */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <Text style={styles.sectionTitle}>Contacto y Soporte</Text>
        
        <TouchableOpacity
          style={styles.contactItem}
          onPress={handleWebsite}
          accessibilityLabel="Visitar sitio web"
          accessibilityRole="button"
        >
          <Ionicons name="globe-outline" size={24} color={colors.primary[500]} />
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Sitio Web</Text>
            <Text style={styles.contactDescription}>pildhora.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactItem}
          onPress={handleEmail}
          accessibilityLabel="Enviar correo de soporte"
          accessibilityRole="button"
        >
          <Ionicons name="mail-outline" size={24} color={colors.primary[500]} />
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Correo de Soporte</Text>
            <Text style={styles.contactDescription}>support@pildhora.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
      </Card>

      {/* Legal */}
      <Card variant="outlined" padding="lg" style={styles.card}>
        <Text style={styles.legalText}>
          © 2024 Pildhora. Todos los derechos reservados.
        </Text>
        <Text style={styles.legalText}>
          Esta aplicación está diseñada para ayudar en la gestión de medicamentos,
          pero no reemplaza el consejo médico profesional.
        </Text>
      </Card>
    </ScrollView>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color={colors.primary[500]} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  brandingSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary[500],
    marginTop: spacing.lg,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  version: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  featureList: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    gap: spacing.md,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  contactDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  legalText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
    marginBottom: spacing.sm,
  },
});
