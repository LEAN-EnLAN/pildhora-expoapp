import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme/tokens';

interface ExitConfirmationDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Exit confirmation modal styled to match the destructive "delete medication" dialog.
 * Bottom sheet with gradient icon, clear messaging, and destructive primary action.
 */
export function ExitConfirmationDialog({
  visible,
  onConfirm,
  onCancel,
}: ExitConfirmationDialogProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <LinearGradient colors={[colors.error[500], colors.error[600]]} style={styles.iconGradient}>
              <Ionicons name="alert" size={24} color={colors.surface} />
            </LinearGradient>
            <Text style={styles.title}>Salir y descartar cambios</Text>
            <Text style={styles.subtitle}>
              Se perderán los horarios, dosis y ajustes que ingresaste en este asistente. ¿Quieres salir sin guardar?
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancelar y seguir en el asistente"
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={styles.discardButton}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Descartar cambios y salir"
            >
              <LinearGradient colors={[colors.error[500], colors.error[600]]} style={styles.discardGradient}>
                <Ionicons name="exit-outline" size={20} color={colors.surface} />
                <Text style={styles.discardText}>Descartar y salir</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    ...shadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
  },
  discardButton: {
    flex: 1.2,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  discardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  discardText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
});
