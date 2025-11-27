import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, typography, borderRadius } from '../../theme/tokens'
import { getRdbInstance } from '../../services/firebase'
import { ref, onValue, off, set } from 'firebase/database'
import { sendDeviceCommand, triggerBuzzer, clearDeviceCommands } from '../../services/deviceCommands'
import { recordIntakeFromTopo } from '../../services/intakeFromTopo'

interface TopoSessionOverlayProps {
  patientId: string
  deviceId: string
  supervised?: boolean
}

const SCREEN = Dimensions.get('window')

export const TopoSessionOverlay: React.FC<TopoSessionOverlayProps> = ({ patientId, deviceId, supervised = true }) => {
  const [visible, setVisible] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [effectsEnabled, setEffectsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const pulse = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(0)).current
  const checkScale = useRef(new Animated.Value(0.8)).current
  const checkOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    ;(async () => {
      try {
        const eff = await AsyncStorage.getItem(`@effects_enabled_${patientId}`)
        const snd = await AsyncStorage.getItem(`@sound_enabled_${patientId}`)
        if (eff != null) setEffectsEnabled(eff === '1')
        if (snd != null) setSoundEnabled(snd === '1')
      } catch {}
    })()
  }, [patientId])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    ;(async () => {
      try {
        const rdb = await getRdbInstance()
        if (!rdb || !deviceId || !supervised) return
        const pathRef = ref(rdb, `devices/${deviceId}/commands/topo`)
        const cb = (snap: any) => {
          const v = !!snap.val()
          if (v) {
            setIsConfirming(false)
            setVisible(true)
            startAlarmAnimations()
            if (soundEnabled) triggerBuzzer(deviceId, true).catch(() => {})
          } else {
            if (visible) {
              startConfirmationAnimations()
            }
          }
        }
        onValue(pathRef, cb)
        unsubscribe = () => off(pathRef, 'value', cb as any)
      } catch (e) {
        // noop
      }
    })()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [deviceId, supervised, soundEnabled, visible])

  const startAlarmAnimations = useCallback(() => {
    pulse.setValue(0)
    glow.setValue(0)
    if (!effectsEnabled) return
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start()
  }, [effectsEnabled, pulse, glow])

  const startConfirmationAnimations = useCallback(() => {
    setIsConfirming(true)
    if (effectsEnabled) {
      checkScale.setValue(0.8)
      checkOpacity.setValue(0)
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, stiffness: 180, damping: 16, mass: 0.8 }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start()
    }
    setTimeout(() => {
      setVisible(false)
      setIsConfirming(false)
    }, 3500)
  }, [effectsEnabled, checkScale, checkOpacity])

  const handleConfirm = useCallback(async () => {
    try {
      if (soundEnabled) await triggerBuzzer(deviceId, false)
    } catch {}
    try {
      const rdb = await getRdbInstance()
      if (rdb) await set(ref(rdb, `devices/${deviceId}/commands/topo`), false)
      await sendDeviceCommand(deviceId, { topo: false })
      await clearDeviceCommands(deviceId)
    } catch {}
    try {
      await recordIntakeFromTopo(patientId, deviceId)
    } catch {}
  }, [patientId, deviceId, soundEnabled])

  const handleToggleEffects = useCallback(async () => {
    const next = !effectsEnabled
    setEffectsEnabled(next)
    try { await AsyncStorage.setItem(`@effects_enabled_${patientId}`, next ? '1' : '0') } catch {}
  }, [effectsEnabled, patientId])

  const handleToggleSound = useCallback(async () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    try { await AsyncStorage.setItem(`@sound_enabled_${patientId}`, next ? '1' : '0') } catch {}
  }, [soundEnabled, patientId])

  const pulseStyle = useMemo(() => {
    const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })
    const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.9] })
    return { transform: [{ scale }], opacity }
  }, [pulse])

  const glowStyle = useMemo(() => {
    const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] })
    return { opacity }
  }, [glow])

  if (!visible && !isConfirming) return null

  return (
    <RNModal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay} accessible accessibilityViewIsModal>
        {isConfirming ? (
          <LinearGradient colors={[colors.success[600], colors.success[500]]} style={styles.container}>
            <Animated.View style={[styles.confirmIconWrap, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}> 
              <Ionicons name="checkmark-circle" size={128} color={colors.surface} />
            </Animated.View>
            <Text style={styles.confirmTitle}>¡Toma confirmada!</Text>
            <Text style={styles.confirmSubtitle}>Excelente trabajo</Text>
          </LinearGradient>
        ) : (
          <LinearGradient colors={[colors.error[700], colors.error[500]]} style={styles.container}>
            {effectsEnabled && (
              <Animated.View style={[styles.pulseCircle, pulseStyle]} />
            )}
            <Animated.View style={[styles.glow, glowStyle]} />
            <View style={styles.iconWrap}>
              <Ionicons name="alarm" size={96} color={colors.surface} />
            </View>
            <Text style={styles.title}>¡Hora de tu medicamento!</Text>
            <Text style={styles.subtitle}>Confirma cuando lo tomes</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm} accessibilityLabel="Confirmar toma" accessibilityRole="button" activeOpacity={0.9}>
                <Ionicons name="checkmark" size={22} color={colors.surface} />
                <Text style={styles.primaryBtnText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleToggleSound} accessibilityLabel="Silenciar efectos sonoros" accessibilityRole="switch" activeOpacity={0.8}>
                <Ionicons name={soundEnabled ? 'volume-high' : 'volume-mute'} size={20} color={colors.surface} />
                <Text style={styles.secondaryBtnText}>{soundEnabled ? 'Sonido: ON' : 'Sonido: OFF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleToggleEffects} accessibilityLabel="Desactivar efectos visuales" accessibilityRole="switch" activeOpacity={0.8}>
                <Ionicons name={effectsEnabled ? 'eye' : 'eye-off'} size={20} color={colors.surface} />
                <Text style={styles.secondaryBtnText}>{effectsEnabled ? 'Efectos: ON' : 'Efectos: OFF'}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pulseCircle: {
    position: 'absolute',
    width: SCREEN.width * 0.9,
    height: SCREEN.width * 0.9,
    borderRadius: (SCREEN.width * 0.9) / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glow: {
    position: 'absolute',
    width: SCREEN.width,
    height: SCREEN.height,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.surface,
    fontSize: Platform.OS === 'ios' ? 34 : 32,
    fontWeight: typography.fontWeight.extrabold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success[600],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 160,
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  secondaryBtnText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmIconWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  confirmTitle: {
    color: colors.surface,
    fontSize: Platform.OS === 'ios' ? 32 : 30,
    fontWeight: typography.fontWeight.extrabold,
    textAlign: 'center',
  },
  confirmSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
})

export default TopoSessionOverlay
