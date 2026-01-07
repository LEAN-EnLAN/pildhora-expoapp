/**
 * TopoAlarmOverlay Component
 * 
 * Full-screen alarm overlay that appears when topo is triggered.
 * Displays medication info with animations and handles user actions
 * based on supervised vs autonomous mode.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// Note: expo-av needs to be installed: npx expo install expo-av
// import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Medication } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

export interface TopoAlarmOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** The medication to display */
  medication: Medication | null;
  /** Whether the patient is in autonomous mode */
  isAutonomous: boolean;
  /** Whether the alarm has timed out */
  hasTimedOut: boolean;
  /** Callback when user takes the medication (autonomous mode) */
  onTake: () => void;
  /** Callback when user skips the medication (autonomous mode) */
  onSkip: () => void;
  /** Callback when alarm is dismissed (supervised mode - device button pressed) */
  onDismiss: () => void;
}

export const TopoAlarmOverlay: React.FC<TopoAlarmOverlayProps> = ({
  visible,
  medication,
  isAutonomous,
  hasTimedOut,
  onTake,
  onSkip,
  onDismiss,
}) => {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sound reference (requires expo-av)
  const soundRef = useRef<any>(null);

  // Start animations when visible
  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  // Play alarm sound and vibration
  useEffect(() => {
    let vibrationInterval: NodeJS.Timeout | null = null;

    const playAlarm = async () => {
      if (!visible) return;

      try {
        // Audio playback - requires expo-av to be installed
        // To enable sound: npx expo install expo-av
        // Then uncomment the Audio import and the code below
        /*
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });

        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../../../assets/sounds/alarm.mp3'),
            { isLooping: true, volume: 1.0 }
          );
          soundRef.current = sound;
          await sound.playAsync();
        } catch (soundError) {
          console.log('[TopoAlarmOverlay] Alarm sound file not found');
        }
        */
        console.log('[TopoAlarmOverlay] Alarm started (sound disabled - install expo-av to enable)');
      } catch (error) {
        console.log('[TopoAlarmOverlay] Could not play alarm sound:', error);
      }

      // Vibration pattern
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 500, 200, 500], true);
      } else {
        vibrationInterval = setInterval(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }, 1000);
      }
    };

    const stopAlarm = async () => {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (error) {
          console.log('[TopoAlarmOverlay] Error stopping sound:', error);
        }
        soundRef.current = null;
      }

      Vibration.cancel();
      if (vibrationInterval) {
        clearInterval(vibrationInterval);
      }
    };

    if (visible) {
      playAlarm();
    } else {
      stopAlarm();
    }

    return () => {
      stopAlarm();
    };
  }, [visible]);

  const handleTake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTake();
  }, [onTake]);

  const handleSkip = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onSkip();
  }, [onSkip]);

  const medicationName = medication?.name || 'Medicación';
  const dosage = medication?.dosage || medication?.doseValue 
    ? `${medication?.doseValue || ''} ${medication?.doseUnit || ''}`.trim()
    : '';
  const emoji = medication?.emoji || '💊';

  const gradientColors = hasTimedOut
    ? [colors.error[600], colors.error[700]]
    : isAutonomous
      ? [colors.primary[500], colors.primary[700]]
      : [colors.warning[500], colors.warning[700]];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <LinearGradient colors={gradientColors} style={styles.gradient}>

          {/* Main content */}
          <View style={styles.content}>
            {/* Icon with pulse animation */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.emoji}>{emoji}</Text>
              </View>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>
              {hasTimedOut ? '⚠️ Tiempo agotado' : '⏰ Hora de tu medicación'}
            </Text>

            {/* Medication info */}
            <View style={styles.medicationCard}>
              <Text style={styles.medicationName}>{medicationName}</Text>
              {dosage ? <Text style={styles.dosage}>{dosage}</Text> : null}
            </View>

            {/* Instructions based on mode */}
            {isAutonomous ? (
              <View style={styles.autonomousSection}>
                <Text style={styles.instructionText}>
                  {hasTimedOut 
                    ? '¿Tomaste tu medicación?' 
                    : 'Confirma cuando tomes tu medicación'}
                </Text>

                {/* Action buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.takeButton}
                    onPress={handleTake}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[colors.success[500], colors.success[600]]}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="checkmark-circle" size={32} color="white" />
                      <Text style={styles.buttonText}>Tomar Medicación</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={28} color="white" />
                    <Text style={styles.skipButtonText}>Omitir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.supervisedSection}>
                <View style={styles.waitingIndicator}>
                  <View style={styles.waitingDot} />
                </View>
                <Text style={styles.instructionText}>
                  {hasTimedOut
                    ? 'Esperando confirmación del cuidador'
                    : 'Modo supervisado: el cuidador debe confirmar en el dispositivo'}
                </Text>
                <Text style={styles.subInstructionText}>
                  Mantén el dispositivo cerca; la alarma se detendrá al confirmarla.
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  medicationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  medicationName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  dosage: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
    textAlign: 'center',
  },
  autonomousSection: {
    width: '100%',
    alignItems: 'center',
  },
  supervisedSection: {
    width: '100%',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 26,
  },
  subInstructionText: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  takeButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  buttonText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: 'white',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: spacing.sm,
  },
  skipButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: 'white',
  },
  waitingIndicator: {
    marginBottom: spacing.lg,
  },
  waitingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export default TopoAlarmOverlay;
