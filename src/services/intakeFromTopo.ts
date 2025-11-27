import { getDbInstance } from './firebase'
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import { IntakeStatus, Medication } from '../types'

const parseTimeToHour = (t?: string) => {
  if (!t) return null
  const [hh, mm] = t.split(':').map((x) => parseInt(x, 10))
  if (isNaN(hh)) return null
  return hh + (isNaN(mm) ? 0 : mm / 60)
}

const buildDateForToday = (timeDecimal: number) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const hh = Math.floor(timeDecimal)
  const mm = Math.round((timeDecimal - hh) * 60)
  const d = new Date(today)
  d.setHours(hh, mm, 0, 0)
  return d
}

export async function recordIntakeFromTopo(patientId: string, deviceId: string) {
  const db = await getDbInstance()
  if (!db) return

  const medsQ = query(collection(db, 'medications'), where('patientId', '==', patientId))
  const medsSnap = await getDocs(medsQ)
  const meds: Medication[] = medsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const intakesQ = query(
    collection(db, 'intakeRecords'),
    where('patientId', '==', patientId),
    orderBy('scheduledTime', 'desc')
  )
  const intakesSnap = await getDocs(intakesQ)
  const intakes = intakesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

  const allSlots: Array<{ medication: Medication; timeDecimal: number }> = []
  meds.forEach((med) => {
    (med.times || []).forEach((time) => {
      const td = parseTimeToHour(time)
      if (td != null) allSlots.push({ medication: med, timeDecimal: td })
    })
  })

  const now = new Date()
  const nowDec = now.getHours() + now.getMinutes() / 60

  const isSlotCompleted = (med: Medication, slotDate: Date) => {
    return intakes.some((r) => {
      const rDate = new Date(r.scheduledTime)
      if (rDate < startOfDay || rDate > endOfDay) return false
      const timeDiff = Math.abs(rDate.getTime() - slotDate.getTime())
      const matchesTime = timeDiff < 5 * 60 * 1000
      const matchesMed = r.medicationId ? r.medicationId === med.id : r.medicationName === med.name
      return matchesTime && (r.status === IntakeStatus.TAKEN || r.status === IntakeStatus.MISSED)
    })
  }

  let best: { medication: Medication; date: Date } | null = null
  let bestDiff = Number.MAX_SAFE_INTEGER
  allSlots.forEach((s) => {
    const d = buildDateForToday(s.timeDecimal)
    if (isSlotCompleted(s.medication, d)) return
    const diff = Math.abs(d.getTime() - now.getTime())
    if (diff < bestDiff) {
      best = { medication: s.medication, date: d }
      bestDiff = diff
    }
  })

  const record = {
    medicationId: best?.medication?.id,
    medicationName: best?.medication?.name || 'Desconocida',
    dosage: best?.medication?.dosage || `${best?.medication?.doseValue || ''}${best?.medication?.doseUnit || ''}`,
    scheduledTime: (best?.date || now).toISOString(),
    status: IntakeStatus.TAKEN,
    takenAt: new Date().toISOString(),
    patientId,
    deviceId: deviceId || 'pillbox',
    source: 'supervised_session',
    timestamp: new Date().toISOString(),
  }

  await addDoc(collection(db, 'intakeRecords'), record as any)
}

