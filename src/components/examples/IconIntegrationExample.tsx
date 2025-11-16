/**
 * IconIntegrationExample Component
 * 
 * Demonstrates all the ways the app icon is integrated throughout the application.
 * This is a reference component for developers.
 * 
 * @example
 * // In a test screen or storybook
 * <IconIntegrationExample />
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';
import { AppIcon, BrandedLoadingScreen, BrandedEmptyState, Card, Button } from '../ui';

export default function IconIntegrationExample() {
  const [showLoading, setShowLoading] = useState(false);

  if (showLoading) {
    return <BrandedLoadingScreen message="Ejemplo de pantalla de carga..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.mainTitle}>Icon Integration Examples</Text>

        {/* Size Variants */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Size Variants</Text>
          <View style={styles.iconRow}>
            <View style={styles.iconExample}>
              <AppIcon size="xs" />
              <Text style={styles.iconLabel}>xs (24px)</Text>
            </View>
            <View style={styles.iconExample}>
              <AppIcon size="sm" />
              <Text style={styles.iconLabel}>sm (32px)</Text>
            </View>
            <View style={styles.iconExample}>
              <AppIcon size="md" />
              <Text style={styles.iconLabel}>md (48px)</Text>
            </View>
          </View>
          <View style={styles.iconRow}>
            <View style={styles.iconExample}>
              <AppIcon size="lg" />
              <Text style={styles.iconLabel}>lg (64px)</Text>
            </View>
            <View style={styles.iconExample}>
              <AppIcon size="xl" />
              <Text style={styles.iconLabel}>xl (96px)</Text>
            </View>
            <View style={styles.iconExample}>
              <AppIcon size="2xl" />
              <Text style={styles.iconLabel}>2xl (128px)</Text>
            </View>
          </View>
        </Card>

        {/* Style Variants */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Style Variants</Text>
          <View style={styles.iconRow}>
            <View style={styles.iconExample}>
              <AppIcon size="lg" showShadow={false} rounded={true} />
              <Text style={styles.iconLabel}>Default</Text>
            </View>
            <View style={styles.iconExample}>
              <AppIcon size="lg" showShadow={true} rounded={true} />
              <Text style={styles.iconLabel}>With Shadow</Text>
            </View>
            <View style={styles.iconExample}>
              <AppIcon size="lg" showShadow={false} rounded={false} />
              <Text style={styles.iconLabel}>Square</Text>
            </View>
          </View>
        </Card>

        {/* Header Example */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Header Branding</Text>
          <View style={styles.headerExample}>
            <AppIcon size="sm" showShadow={false} rounded={true} />
            <Text style={styles.headerText}>PILDHORA</Text>
          </View>
        </Card>

        {/* Loading Screen Example */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Loading Screen</Text>
          <Button
            variant="primary"
            onPress={() => {
              setShowLoading(true);
              setTimeout(() => setShowLoading(false), 3000);
            }}
          >
            Show Loading Screen (3s)
          </Button>
        </Card>

        {/* Empty State Example */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Empty State with Icon</Text>
          <View style={styles.emptyStateContainer}>
            <BrandedEmptyState
              showAppIcon={true}
              title="No hay datos"
              message="Este es un ejemplo de estado vacío con el icono de la app"
            />
          </View>
        </Card>

        {/* Empty State with Custom Icon */}
        <Card variant="elevated" padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Empty State with Custom Icon</Text>
          <View style={styles.emptyStateContainer}>
            <BrandedEmptyState
              icon="medical-outline"
              title="No hay medicamentos"
              message="Agrega tu primer medicamento para comenzar"
              actionLabel="Agregar medicamento"
              onAction={() => alert('Action pressed!')}
            />
          </View>
        </Card>

        {/* Usage Notes */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Guidelines</Text>
          <Text style={styles.guidelineText}>
            • Use xs/sm sizes for headers and inline branding{'\n'}
            • Use md/lg sizes for cards and prominent displays{'\n'}
            • Use xl/2xl sizes for splash, loading, and auth screens{'\n'}
            • Enable shadow for emphasis on light backgrounds{'\n'}
            • Use BrandedLoadingScreen for major transitions{'\n'}
            • Use BrandedEmptyState for empty lists and no-data scenarios
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
  mainTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.gray[900],
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconExample: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textAlign: 'center',
  },
  headerExample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  headerText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary[500],
  },
  emptyStateContainer: {
    minHeight: 300,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  guidelineText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
