import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, set, onValue, off } from 'firebase/database';
import { getDeviceRdbInstance } from '../../services/firebase';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/tokens';

interface TestTopoButtonProps {
  deviceId?: string;
}

/**
 * TestTopoButton Component
 * 
 * A specialized button for testing the TOPO functionality on hardware devices.
 * Provides real-time feedback on the TOPO state and allows triggering the test sequence.
 * 
 * Features:
 * - Real-time state visualization
 * - Interactive control
 * - Haptic/Visual feedback
 * - Error handling
 */
export const TestTopoButton = ({ deviceId = 'TEST-DEVICE-001' }: TestTopoButtonProps) => {
  const [topoState, setTopoState] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Animation value for the pulse effect when active
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      const rdb = await getDeviceRdbInstance();
      if (!rdb) return;
      
      const pathRef = ref(rdb, `devices/${deviceId}/commands/topo`);
      const cb = (snap: any) => {
        const v = snap.val();
        setTopoState(typeof v === 'boolean' ? v : !!v);
      };
      
      onValue(pathRef, cb);
      unsubscribe = () => off(pathRef, 'value', cb as any);
    };

    setupListener();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [deviceId]);

  // Pulse animation effect when topoState is true
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (topoState) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [topoState]);

  const handlePress = useCallback(async () => {
    setLoading(true);
    try {
      const rdb = await getDeviceRdbInstance();
      if (!rdb) {
        Alert.alert('Error', 'Firebase Database not initialized');
        return;
      }
      const actionPath = `devices/${deviceId}/commands/topo`;
      await set(ref(rdb, actionPath), true);
      Alert.alert('Éxito', `Se ha enviado la señal TOPO al dispositivo ${deviceId}. El dispositivo iniciará la secuencia.`);
    } catch (error: any) {
      console.error('Test Topo Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Quick stop handler - sets topo to false
  const handleStop = useCallback(async () => {
    setLoading(true);
    try {
      const rdb = await getDeviceRdbInstance();
      if (!rdb) {
        Alert.alert('Error', 'Firebase Database not initialized');
        return;
      }
      const actionPath = `devices/${deviceId}/commands/topo`;
      await set(ref(rdb, actionPath), false);
    } catch (error: any) {
      console.error('Stop Topo Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const getStatusColor = () => {
    if (topoState === null) return colors.gray[400];
    return topoState ? colors.error[500] : colors.success[500];
  };

  const getStatusText = () => {
    if (topoState === null) return 'Desconectado';
    return topoState ? 'ACTIVO' : 'INACTIVO';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={loading || topoState === true}
        accessibilityLabel="Probar dispositivo TOPO"
        accessibilityHint={`Envía una señal de prueba al dispositivo ${deviceId}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading || topoState === true, checked: topoState || false }}
      >
        <LinearGradient
          colors={topoState ? colors.gradients.sunset : [colors.primary[500], colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <View style={styles.contentContainer}>
            <View style={styles.leftSection}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="hardware-chip-outline" 
                  size={24} 
                  color="white" 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>Prueba TOPO</Text>
                <Text style={styles.subtitle}>{deviceId}</Text>
              </View>
            </View>


            <View style={styles.rightSection}>
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={styles.statusContainer}>
                  <Animated.View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: topoState ? 'white' : 'rgba(255,255,255,0.5)' },
                      topoState && { transform: [{ scale: pulseAnim }] }
                    ]} 
                  />
                  <Text style={styles.statusText}>
                    {getStatusText()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Quick Stop Button - Only visible when TOPO is active */}
      {topoState && (
        <TouchableOpacity
          onPress={handleStop}
          activeOpacity={0.8}
          disabled={loading}
          style={styles.stopButton}
          accessibilityLabel="Detener TOPO"
          accessibilityHint="Apaga la señal TOPO inmediatamente"
          accessibilityRole="button"
        >
          <Ionicons name="stop-circle" size={20} color="white" />
          <Text style={styles.stopButtonText}>Apagar TOPO</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  button: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    minHeight: 72,
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[600],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  stopButtonText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
