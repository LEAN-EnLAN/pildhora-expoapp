import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal as RNModal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';
import { Medication } from '../../types';

interface DeleteMedicationDialogProps {
  visible: boolean;
  medication: Medication;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Enhanced deletion confirmation dialog with multiple safety checks
 * Prevents accidental medication deletion with clear warnings
 */
export const DeleteMedicationDialog: React.FC<DeleteMedicationDialogProps> = ({
  visible,
  medication,
  onConfirm,
  onCancel,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [hasReadWarnings, setHasReadWarnings] = useState(false);

  const isConfirmationValid = confirmationText.toLowerCase() === 'eliminar';
  const canDelete = isConfirmationValid && hasReadWarnings;

  const handleCancel = () => {
    setConfirmationText('');
    setHasReadWarnings(false);
    onCancel();
  };

  const handleConfirm = () => {
    if (canDelete) {
      setConfirmationText('');
      setHasReadWarnings(false);
      onConfirm();
    }
  };

  const scheduledDosesPerDay = medication.times.length;
  const hasActiveSchedule = scheduledDosesPerDay > 0;
  const hasInventoryTracking = medication.trackInventory;
  const hasLowInventory = hasInventoryTracking && 
    medication.currentQuantity !== undefined && 
    medication.lowQuantityThreshold !== undefined &&
    medication.currentQuantity <= medication.lowQuantityThreshold;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning" size={32} color={colors.error[500]} />
            </View>
            <Text style={styles.title}>¿Eliminar medicamento?</Text>
          </View>

          <View style={styles.medicationInfo}>
            <View style={styles.medicationHeader}>
              {medication.emoji ? (
                <Text style={styles.emoji}>{medication.emoji}</Text>
              ) : (
                <Ionicons name="medkit" size={24} color={colors.primary[500]} />
              )}
              <Text style={styles.medicationName}>{medication.name}</Text>
            </View>
            {medication.doseValue && medication.doseUnit && (
              <Text style={styles.dosageText}>
                {medication.doseValue} {medication.doseUnit}
                {medication.quantityType ? ` ${medication.quantityType}` : ''}
              </Text>
            )}
          </View>

          <View style={styles.warningsContainer}>
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={20} color={colors.error[600]} />
              <Text style={styles.warningText}>
                Esta acción es permanente y no se puede deshacer
              </Text>
            </View>

            {hasActiveSchedule && (
              <View style={styles.warningBox}>
                <Ionicons name="time" size={20} color={colors.warning[600]} />
                <Text style={styles.warningText}>
                  Se eliminarán {scheduledDosesPerDay} {scheduledDosesPerDay === 1 ? 'alarma programada' : 'alarmas programadas'} por día
                </Text>
              </View>
            )}

            {hasInventoryTracking && (
              <View style={styles.warningBox}>
                <Ionicons name="cube" size={20} color={colors.warning[600]} />
                <Text style={styles.warningText}>
                  Se perderá el seguimiento de inventario
                  {medication.currentQuantity !== undefined && 
                    ` (${medication.currentQuantity} dosis actuales)`}
                </Text>
              </View>
            )}

            {hasLowInventory && (
              <View style={[styles.warningBox, styles.criticalWarning]}>
                <Ionicons name="warning" size={20} color={colors.error[600]} />
                <Text style={[styles.warningText, styles.criticalWarningText]}>
                  ⚠️ Este medicamento tiene inventario bajo. Asegúrate de que el paciente tenga suficiente medicamento antes de eliminarlo.
                </Text>
              </View>
            )}

            <View style={styles.warningBox}>
              <Ionicons name="document-text" size={20} color={colors.info[600]} />
              <Text style={styles.warningText}>
                El historial de dosis pasadas se conservará para referencia
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setHasReadWarnings(!hasReadWarnings)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasReadWarnings }}
            accessibilityLabel="He leído y entiendo las advertencias"
          >
            <View style={[styles.checkbox, hasReadWarnings && styles.checkboxChecked]}>
              {hasReadWarnings && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              He leído y entiendo las advertencias anteriores
            </Text>
          </TouchableOpacity>

          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationLabel}>
              Para confirmar, escribe <Text style={styles.confirmationKeyword}>ELIMINAR</Text> a continuación:
            </Text>
            <TextInput
              style={[
                styles.confirmationInput,
                !hasReadWarnings && styles.confirmationInputDisabled,
              ]}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="Escribe ELIMINAR"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="none"
              autoCorrect={false}
              editable={hasReadWarnings}
              accessibilityLabel="Campo de confirmación de eliminación"
              accessibilityHint="Escribe la palabra ELIMINAR para confirmar"
            />
            {confirmationText && !isConfirmationValid && (
              <View style={styles.validationError}>
                <Ionicons name="close-circle" size={16} color={colors.error[500]} />
                <Text style={styles.validationErrorText}>
                  Debe escribir exactamente "ELIMINAR"
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              variant="secondary"
              size="lg"
              onPress={handleCancel}
              style={styles.actionButton}
              accessibilityLabel="Cancelar eliminación"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="lg"
              onPress={handleConfirm}
              disabled={!canDelete}
              style={styles.actionButton}
              accessibilityLabel="Confirmar eliminación de medicamento"
            >
              Eliminar
            </Button>
          </View>
        </View>
      </View>
    </RNModal>
  );
};


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    ...shadows.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
  },
  medicationInfo: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  medicationName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    flex: 1,
  },
  dosageText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginLeft: 32,
  },
  warningsContainer: {
    marginBottom: spacing.lg,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.warning[500],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  criticalWarning: {
    backgroundColor: colors.error[50],
    borderLeftColor: colors.error[500],
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  criticalWarningText: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[700],
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  checkboxLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
  },
  confirmationContainer: {
    marginBottom: spacing.lg,
  },
  confirmationLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  confirmationKeyword: {
    fontWeight: typography.fontWeight.bold,
    color: colors.error[600],
  },
  confirmationInput: {
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.surface,
  },
  confirmationInputDisabled: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
    color: colors.gray[400],
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  validationErrorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[600],
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
