import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';
import { Medication } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DeleteMedicationDialogProps {
  visible: boolean;
  medication: Medication;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteMedicationDialog: React.FC<DeleteMedicationDialogProps> = ({
  visible,
  medication,
  onConfirm,
  onCancel,
}) => {
  const [step, setStep] = useState<'info' | 'confirm'>('info');
  const [isDeleting, setIsDeleting] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('info');
      setIsDeleting(false);
      progressAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleCancel = () => { setStep('info'); setIsDeleting(false); onCancel(); };
  const handleConfirmDelete = () => {
    setIsDeleting(true);
    Animated.timing(progressAnim, { toValue: 1, duration: 1200, useNativeDriver: false }).start(() => onConfirm());
  };

  const scheduledDosesPerDay = medication.times?.length || 0;
  const hasInventoryTracking = medication.trackInventory;
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={handleCancel} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdropPress} onPress={handleCancel} />
        <Animated.View style={[styles.dialogContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.dialog}>
            <View style={styles.handleBar} />
            {step === 'info' ? (
              <>
                <View style={styles.header}>
                  <LinearGradient colors={[colors.error[500], colors.error[600]]} style={styles.iconGradient}>
                    <Ionicons name="trash-outline" size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.title}>Eliminar medicamento</Text>
                  <Text style={styles.subtitle}>Esta accion no se puede deshacer</Text>
                </View>
                <View style={styles.medicationPreview}>
                  <View style={styles.medicationIcon}>
                    {medication.emoji ? <Text style={styles.emoji}>{medication.emoji}</Text> : <Ionicons name="medical" size={24} color={colors.primary[500]} />}
                  </View>
                  <View style={styles.medicationDetails}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    {medication.doseValue && medication.doseUnit && (
                      <Text style={styles.medicationDosage}>{medication.doseValue} {medication.doseUnit}{medication.quantityType ?  + medication.quantityType : ''}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.impactSection}>
                  <Text style={styles.impactTitle}>Que se eliminara?</Text>
                  <View style={styles.impactItem}>
                    <View style={[styles.impactIcon, { backgroundColor: colors.warning[50] }]}>
                      <Ionicons name="alarm-outline" size={18} color={colors.warning[600]} />
                    </View>
                    <View style={styles.impactText}>
                      <Text style={styles.impactLabel}>{scheduledDosesPerDay} alarmas programadas</Text>
                      <Text style={styles.impactDescription}>Se cancelaran todos los recordatorios</Text>
                    </View>
                  </View>
                  {hasInventoryTracking && (
                    <View style={styles.impactItem}>
                      <View style={[styles.impactIcon, { backgroundColor: colors.info[50] }]}>
                        <Ionicons name="cube-outline" size={18} color={colors.info[600]} />
                      </View>
                      <View style={styles.impactText}>
                        <Text style={styles.impactLabel}>Seguimiento de inventario</Text>
                        <Text style={styles.impactDescription}>{medication.currentQuantity !== undefined ? 'Perderás el registro de ' + medication.currentQuantity + ' dosis' : 'Se perderá el registro'}</Text>
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.proceedButton} onPress={() => setStep('confirm')}><Text style={styles.proceedButtonText}>Continuar</Text><Ionicons name="arrow-forward" size={18} color={colors.error[600]} /></TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.confirmHeader}>
                  <Ionicons name="alert-circle" size={56} color={colors.error[500]} />
                  <Text style={styles.confirmTitle}>Estas seguro?</Text>
                  <Text style={styles.confirmSubtitle}>Eliminaras permanentemente {medication.name}</Text>
                </View>
                {isDeleting ? (
                  <View style={styles.deletingContainer}>
                    <View style={styles.progressBarContainer}><Animated.View style={[styles.progressBar, { width: progressWidth }]} /></View>
                    <Text style={styles.deletingText}>Eliminando medicamento...</Text>
                  </View>
                ) : (
                  <View style={styles.confirmActions}>
                    <TouchableOpacity style={styles.backButton} onPress={() => setStep('info')}><Ionicons name="arrow-back" size={20} color={colors.gray[600]} /><Text style={styles.backButtonText}>Volver</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleConfirmDelete}>
                      <LinearGradient colors={[colors.error[500], colors.error[600]]} style={styles.deleteButtonGradient}>
                        <Ionicons name="trash" size={20} color="#FFFFFF" /><Text style={styles.deleteButtonText}>Si, eliminar</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  backdropPress: { flex: 1 },
  dialogContainer: { width: '100%' },
  dialog: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius['2xl'], borderTopRightRadius: borderRadius['2xl'], paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'], ...shadows.xl },
  handleBar: { width: 40, height: 4, backgroundColor: colors.gray[300], borderRadius: borderRadius.full, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  iconGradient: { width: 64, height: 64, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.gray[900], marginBottom: spacing.xs },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.gray[500] },
  medicationPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray[50], borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.xl },
  medicationIcon: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, ...shadows.sm },
  emoji: { fontSize: 24 },
  medicationDetails: { flex: 1 },
  medicationName: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray[900], marginBottom: 2 },
  medicationDosage: { fontSize: typography.fontSize.sm, color: colors.gray[500] },
  impactSection: { marginBottom: spacing.xl },
  impactTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray[700], marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  impactItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  impactIcon: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  impactText: { flex: 1 },
  impactLabel: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.gray[800], marginBottom: 2 },
  impactDescription: { fontSize: typography.fontSize.sm, color: colors.gray[500] },
  actions: { flexDirection: 'row', gap: spacing.md },
  cancelButton: { flex: 1, backgroundColor: colors.gray[100], borderRadius: borderRadius.xl, paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[700] },
  proceedButton: { flex: 1, flexDirection: 'row', backgroundColor: colors.error[50], borderRadius: borderRadius.xl, paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  proceedButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.error[600] },
  confirmHeader: { alignItems: 'center', marginBottom: spacing['2xl'] },
  confirmTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.gray[900], marginBottom: spacing.sm, marginTop: spacing.md },
  confirmSubtitle: { fontSize: typography.fontSize.base, color: colors.gray[600], textAlign: 'center', lineHeight: 24 },
  deletingContainer: { alignItems: 'center', paddingVertical: spacing.xl },
  progressBarContainer: { width: '100%', height: 8, backgroundColor: colors.gray[200], borderRadius: borderRadius.full, overflow: 'hidden', marginBottom: spacing.md },
  progressBar: { height: '100%', backgroundColor: colors.error[500], borderRadius: borderRadius.full },
  deletingText: { fontSize: typography.fontSize.sm, color: colors.gray[600] },
  confirmActions: { flexDirection: 'row', gap: spacing.md },
  backButton: { flex: 1, flexDirection: 'row', backgroundColor: colors.gray[100], borderRadius: borderRadius.xl, paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  backButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.gray[700] },
  deleteButton: { flex: 1.5, borderRadius: borderRadius.xl, overflow: 'hidden' },
  deleteButtonGradient: { flexDirection: 'row', paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  deleteButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
});
