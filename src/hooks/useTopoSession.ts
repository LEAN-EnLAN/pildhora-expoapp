import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getRdbInstance } from '../services/firebase'
import { ref, onValue, off } from 'firebase/database'
import { sendDeviceCommand, triggerBuzzer } from '../services/deviceCommands'

interface TopoSessionSettings {
  effectsEnabled: boolean
  soundEnabled: boolean
}

export function useTopoSession(patientId: string | undefined, deviceId: string | undefined) {
  const [isAlarm, setIsAlarm] = useState(false)
  const [settings, setSettings] = useState<TopoSessionSettings>({ effectsEnabled: true, soundEnabled: true })

  useEffect(() => {
    ;(async () => {
      try {
        if (!patientId) return
        const eff = await AsyncStorage.getItem(`@effects_enabled_${patientId}`)
        const snd = await AsyncStorage.getItem(`@sound_enabled_${patientId}`)
        setSettings({ effectsEnabled: eff == null ? true : eff === '1', soundEnabled: snd == null ? true : snd === '1' })
      } catch {}
    })()
  }, [patientId])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    ;(async () => {
      try {
        if (!deviceId) return
        const rdb = await getRdbInstance()
        if (!rdb) return
        const pathRef = ref(rdb, `devices/${deviceId}/commands/topo`)
        const cb = (snap: any) => setIsAlarm(!!snap.val())
        onValue(pathRef, cb)
        unsubscribe = () => off(pathRef, 'value', cb as any)
      } catch {}
    })()
    return () => { if (unsubscribe) unsubscribe() }
  }, [deviceId])

  const setEffectsEnabled = useCallback(async (enabled: boolean) => {
    setSettings((s) => ({ ...s, effectsEnabled: enabled }))
    try { if (patientId) await AsyncStorage.setItem(`@effects_enabled_${patientId}`, enabled ? '1' : '0') } catch {}
  }, [patientId])

  const setSoundEnabled = useCallback(async (enabled: boolean) => {
    setSettings((s) => ({ ...s, soundEnabled: enabled }))
    try { if (patientId) await AsyncStorage.setItem(`@sound_enabled_${patientId}`, enabled ? '1' : '0') } catch {}
  }, [patientId])

  const confirm = useCallback(async () => {
    try {
      if (!deviceId) return
      if (settings.soundEnabled) await triggerBuzzer(deviceId, false)
      await sendDeviceCommand(deviceId, { topo: false })
    } catch {}
  }, [deviceId, settings.soundEnabled])

  return { isAlarm, settings, setEffectsEnabled, setSoundEnabled, confirm }
}

