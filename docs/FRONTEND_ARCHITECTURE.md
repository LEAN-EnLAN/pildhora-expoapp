# Front-end Architecture and Implementation Guide (Expo React Native)

Version: 1.0

Overview
- Tech stack: Expo React Native (TypeScript), Redux Toolkit, Firebase (Auth, Firestore, Functions), NativeWind/Tailwind (optional), BLE services, Notifications.
- Goal: Instant UI rendering with a stale-while-revalidate (SWR) strategy. The app draws screens immediately from static defaults or cached data, then upgrades to live Firestore data when ready. This improves perceived performance and resilience.

Key Pattern: Stale-While-Revalidate
- Render immediately from static JSON defaults or last-known cache.
- Hydrate from AsyncStorage cache (if present).
- Subscribe to Firestore in the background (onSnapshot or getDocs + onSnapshot).
- When data arrives, update UI state and write to cache.
- Show skeletons only for parts without static/cache data.

====================================================
1) Technical Specifications for Front-end Components
====================================================

Screens (examples in app/)
- auth/login.tsx
  - Responsibility: capture credentials, call Auth slice thunks (sign-in), handle validation, show error/success.
  - Inputs: email, password. Outputs: dispatch signIn, navigate on success.
  - Data sources: None (form-only), uses Auth state from Redux.

- auth/signup.tsx
  - Responsibility: capture user details, create account via Firebase Auth, seed user doc in Firestore.
  - Data sources: Auth slice; Firestore writes via thunks.

- patient/home.tsx
  - Responsibility: display daily tasks/medications and device status.
  - Data sources: Tasks and Medications slices (Firestore collections), BLE status, Notifications permissions.
  - SWR: initialData static JSON → cache → Firestore snapshot.

- caregiver/dashboard.tsx
  - Responsibility: overview of patient adherence, alerts, and upcoming tasks.
  - Data sources: Reports/Tasks collections (aggregated or queried), Auth to identify caregiver.
  - SWR: same pattern as patient home.

Components (examples in src/components/)
- DoseRing.tsx
  - Responsibility: visual representation of doses taken vs remaining.
  - Props: totalDoses (number), takenDoses (number), status ('onTime'|'late'|'missed').
  - Performance: memoized, receives primitive props; avoid passing large arrays.

Slices (src/store/slices/)
- authSlice: Auth state (user, status, error), thunks for sign-in/up/out, onAuthStateChanged wiring.
- medicationsSlice: CRUD for medications; uses Firestore collections.
- tasksSlice: CRUD for tasks; queries by user/date; ensures indexing.
  - Pattern: thunks call Firestore, reducers update normalized state; selectors derive data.

Services (src/services/)
- firebase/index.ts: Initializes Firebase using EXPO_PUBLIC_* env vars (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Exports auth, db, functions.
- ble/, notifications/, ai/: platform-specific integrations kept isolated.

====================================================
2) Step-by-Step Implementation Guides with Code Examples
====================================================

2.1 Cache Helpers (AsyncStorage)
- Install: `expo install @react-native-async-storage/async-storage`

Example: src/utils/cache.ts
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

type CachePayload<T> = { version: number; ts: number; data: T };

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const payload: CachePayload<T> = JSON.parse(raw);
    return payload.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T, version = 1): Promise<void> {
  const payload: CachePayload<T> = { version, ts: Date.now(), data };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}
```

2.2 SWR Hook for Firestore Collections
Example: src/hooks/useCollectionSWR.ts
```ts
import { useEffect, useState } from 'react';
import { onSnapshot, getDocs, Query, QuerySnapshot } from 'firebase/firestore';
import { getCache, setCache } from '../utils/cache';

type Source = 'static' | 'cache' | 'firestore';

export function useCollectionSWR<T>({
  cacheKey,
  query,
  initialData,
}: { cacheKey: string; query: Query; initialData?: T[] }) {
  const [data, setData] = useState<T[]>(initialData ?? []);
  const [source, setSource] = useState<Source>(initialData ? 'static' : 'cache');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    (async () => {
      // Hydrate from cache
      const cached = await getCache<T[]>(cacheKey);
      if (mounted && cached && (!initialData || cached.length)) {
        setData(cached);
        setSource(initialData ? 'static' : 'cache');
        setLoading(false);
      }

      // Fast initial read
      try {
        const snap = await getDocs(query);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
        if (mounted) {
          setData(docs);
          setSource('firestore');
          setCache(cacheKey, docs);
          setLoading(false);
        }
      } catch (e: any) {
        setError(e);
      }

      // Live updates
      unsub = onSnapshot(query, (snapshot: QuerySnapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
        if (mounted) {
          setData(docs);
          setSource('firestore');
          setCache(cacheKey, docs);
        }
      }, (e) => setError(e));
    })();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [cacheKey, query]);

  return { data, source, isLoading, error };
}
```

2.3 Usage in a Screen (Patient Home)
```ts
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCollectionSWR } from '../../hooks/useCollectionSWR';

const STATIC_TASKS = [
  { id: 'placeholder-1', title: 'Morning pill', time: '08:00', status: 'pending' },
];

export default function PatientHome() {
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', 'currentUserId'),
    orderBy('scheduledAt')
  );

  const { data: tasks, source, isLoading } = useCollectionSWR({
    cacheKey: 'tasks:currentUserId',
    query: q,
    initialData: STATIC_TASKS,
  });

  // Render tasks immediately; show skeletons for missing pieces
  // Use FlashList/FlatList for performance
}
```

2.4 Skeletons and Badges
- Show skeletons only when both initialData and cache are empty.
- Optional badge indicating data source (static/cache/live) to aid debugging.

2.5 Indexing Firestore Queries
- Ensure composite indexes exist for `where(...), orderBy(...)` combos used in Tasks/Medications.
- Keep `firestore.indexes.json` synced; deploy with `firebase deploy --only firestore:indexes`.

====================================================
3) Architecture Diagrams (ASCII)
====================================================

3.1 Data Flow (SWR)
```
[Static JSON] → [AsyncStorage Cache] → [Firestore Query]
       \             |                       |
        \            v                       v
         → [SWR Hook] → [Redux Slice/Local State] → [Screen/Components]
```

3.2 Component Relationships
```
App (_layout) → Screen (patient/home)
  ├─ DoseRing (pure UI)
  ├─ TaskList (virtualized)
  └─ StatusBar (BLE/Notifications)

Screen ← Selectors (tasksSlice, medicationsSlice)
Screen ← useCollectionSWR (queries db)
Selectors ← Normalized state in slices
```

====================================================
4) State Management Strategies and Data Flow Patterns
====================================================

- Redux Toolkit
  - Keep server-derived data in slices (tasks, medications, user profile).
  - Normalize collections by id; create selectors for derived data.
  - Use thunks for Firestore CRUD; encapsulate query construction.
- Local UI State
  - Keep view-only flags (dialog open, filters) in component state.
- SWR Layering
  - initialData → cache → live Firestore.
  - If offline, keep rendering from cache; queue mutations and retry.
- Navigation
  - Gate routes on Auth state; show auth screens if not signed in.

====================================================
5) Performance Optimization Techniques
====================================================

- Rendering
  - Use FlashList (Shopify) or FlatList with `getItemLayout` and `keyExtractor`.
  - Memoize components (`React.memo`), heavy computations (`useMemo`), and handlers (`useCallback`).
  - Avoid passing large objects as props; pass ids and select in child when possible.
- Firestore
  - Index queries; avoid unbounded queries; paginate or limit.
  - Prefer `onSnapshot` for incremental updates; batch writes where applicable.
- App Startup
  - Pre-hydrate cache for critical screens at app start.
  - Lazy-load non-critical features (caregiver dashboard) on navigation.
- RN Specific
  - Enable Hermes; reduce unnecessary re-renders using `useFocusEffect` wisely.
  - Avoid Anonymous functions in JSX for lists; keep item components pure.

====================================================
6) Testing Methodologies and QA Processes
====================================================

- Unit Tests (Jest)
  - Test selectors, reducers, and utils (cache.ts).
  - Mock Firestore queries for thunks.
- Integration Tests (React Native Testing Library)
  - Render screens; verify SWR behavior (static → cache → live update).
  - Mock AsyncStorage and Firestore (emulator or stubs).
- E2E (Detox)
  - Automate flows: login, loading tasks, updating adherence.
- Firebase Emulator Suite
  - Use local emulators for Auth/Firestore/Functions during CI.
- QA Checklist
  - Performance budget: initial render < 200ms for static data.
  - Accessibility: screen-reader labels present; color contrast; font scaling.

====================================================
7) Accessibility Standards Compliance
====================================================

- Use RN accessibility props: `accessible`, `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`.
- Ensure contrast ratio meets WCAG AA.
- Support Dynamic Type (font scaling via `AccessibilityInfo` / StyleSheet percentages).
- Provide focus order and semantics for interactive elements.
- Test with TalkBack (Android) and VoiceOver (iOS).

====================================================
8) Responsive Design Guidelines
====================================================

- Use Flexbox and `useWindowDimensions` for adaptive layouts.
- Apply NativeWind/Tailwind utility classes consistently (if enabled).
- Respect safe areas (`SafeAreaView`).
- Define breakpoints for larger devices (tablets) and adjust grid/list density.
- Test across portrait/landscape; handle orientation changes.

====================================================
9) Browser Compatibility Considerations
====================================================

- Expo Web (optional)
  - Use `react-native-web` compatible components; avoid platform-only APIs.
  - Feature-detect capabilities; polyfill if required.
- Platform Differences (iOS/Android)
  - Account for permission flows (Notifications, BLE) and styling differences.

====================================================
10) Security Best Practices (Front-end)
====================================================

- Do not use service account keys in the front-end. Keep `serviceAccountKey.json` server-side only.
- Use Firebase Auth securely; never store raw passwords.
- Harden Firestore security rules; avoid open read/write.
- Validate inputs client-side; sanitize text if rendering HTML (rare in RN).
- Restrict environment variables: only `EXPO_PUBLIC_*` needed at runtime; others should remain private.
- Avoid logging sensitive data.

====================================================
Version Control and Maintenance Guidelines
====================================================

- Branching: `feature/swr-cache`, `fix/perf-list`, `docs/frontend-guide`.
- Commit messages: Conventional Commits (feat:, fix:, docs:, perf:, refactor:, test:).
- Code Review: enforce lint/test; verify SWR flow and indexes.
- Documentation Maintenance: bump version in this file; include change log entries.
- Environment Management: `.env` uses individual EXPO_PUBLIC_* variables; after updates restart Expo.
- Indexes/Rules: keep `firestore.indexes.json` and `firestore.rules` in sync; deploy via Firebase CLI.

====================================================
Quick Start
====================================================

- Ensure `.env` has correct Firebase config (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
- Run dev server: `npx expo start --port 8081` (choose any port).
- Implement SWR on key screens using `useCollectionSWR` and `cache.ts`.
- Verify performance and offline behavior with emulators.

For questions or improvements, create issues with label `frontend` and reference this guide.

====================================================
Capítulo 1: Flujos y Wireframing (Integración de Requisitos)
====================================================

1.3 Flujo del Paciente: Panel Principal (Dashboard)
- Objetivo: Diseñar la pantalla Dashboard del Paciente basada en los bocetos (Imagen 1/2), con un componente de anillo visual de adherencia y módulos de métricas de salud.

Componente Visual de Dosis (Anillo 24h)
- Librería: `react-native-svg` (instalación: `expo install react-native-svg`).
- Estructura: anillo circular que representa un día de 24 horas, dividido en secciones por bloques horarios (por ejemplo: mañana, tarde, noche) derivados de las alarmas programadas del usuario.
- Estados visuales:
  - Pendiente: gris
  - Tomada: verde
  - Omitida: rojo

Sincronización de Estado (Tiempo Real)
- Fuente de datos: Firebase Realtime Database (RTDB) en `devices/{deviceID}/state`.
- Listener: `onValue(ref(db, 'devices/{deviceID}/state'), cb)` para actualizar colores/segmentos en tiempo real según el estado actual.

Ejemplo de componente (simplificado)
```tsx
// src/components/DoseRing.tsx
import React, { useMemo } from 'react';
import Svg, { Circle } from 'react-native-svg';

type Segment = { startHour: number; endHour: number; status: 'PENDING'|'DOSE_TAKEN'|'DOSE_MISSED' };

export function DoseRing({ segments }: { segments: Segment[] }) {
  // Mapear estado → color
  const colorFor = (s: Segment) => s.status === 'DOSE_TAKEN' ? '#22c55e' : s.status === 'DOSE_MISSED' ? '#ef4444' : '#9ca3af';
  // Calcular arcos por segmento (omitir detalles geométricos por brevedad)
  const arcs = useMemo(() => segments.map(s => ({ color: colorFor(s) })), [segments]);
  return (
    <Svg height={220} width={220}>
      {arcs.map((a, i) => (
        <Circle key={i} cx={110} cy={110} r={90} stroke={a.color} strokeWidth={16} fill="none" />
      ))}
    </Svg>
  );
}
```

Lectura y mapeo de estado del pastillero
```ts
// src/services/deviceSync.ts
import { getDatabase, ref, onValue } from 'firebase/database';

export type DeviceState = {
  is_online: boolean;
  battery_level: number;
  current_status: 'PENDING'|'DOSE_TAKEN'|'DOSE_MISSED';
  last_event_at?: number;
};

export function listenDeviceState(deviceID: string, onChange: (state: DeviceState) => void) {
  const rdb = getDatabase();
  const r = ref(rdb, `devices/${deviceID}/state`);
  return onValue(r, (snap) => {
    const val = snap.val() as DeviceState | null;
    if (val) onChange(val);
  });
}
```

Seguimiento Holístico (Métricas de Salud)
- Añadir módulos para registrar: Nivel de Dolor, Estado de Ánimo, Presión Arterial.
- Persistencia: Firestore (colección `users/{userId}/health_metrics` o `reports`).
- Ejemplo de guardado:
```ts
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export async function saveHealthMetric(userId: string, metric: { type: string; value: number|string; ts: number }) {
  await addDoc(collection(db, 'reports'), { userId, ...metric });
}
```

1.4 Flujo del Paciente: Gestión de Medicamentos
- Objetivo: Sección “Medicación” para añadir/editar/eliminar.
- Autocompletado: Simulado con lista local (o API futura).
- Iconografía: Selección de forma/color de píldora asociada a cada medicamento.
- Advertencia de Interacción: Al añadir un nuevo medicamento, comparar con la lista existente del paciente y mostrar alerta si hay interacciones conocidas.
- Recordatorios de Resurtido (Refill): Campo `refillDate` y programación de notificaciones locales.

Guías de implementación
- Datos: Firestore colección `medications` con campos { userId, name, dose, schedule[], iconShape, iconColor, interactions[], refillDate }.
- Autocompletado: `STATIC_DRUG_NAMES` + filtro por texto.
- Interacciones: matriz simple de pares conflictivos (p.ej., `{ A: ['B','C'] }`).
- Refill: si `refillDate` está próximo, mostrar aviso y programar notificación.

Código ejemplo (añadir)
```ts
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

export async function addMedication(userId: string, med: any) {
  return addDoc(collection(db, 'medications'), { userId, ...med });
}
```

1.5 Flujo del Paciente: Configuración del Pastillero
- Objetivo: Página de configuración con control granular.
- Sincronización Inicial: Guiar al usuario para conectarse al AP `PildHora_Setup` provisto por el firmware (WiFiManager), luego completar vinculación con la red doméstica.
- Controles de Hardware: Escribir en `devices/{deviceID}/config` (RTDB).
- Controles:
  - Slider: `led_intensity` (0–1023) → `/config/led_intensity`
  - Selector de color: RGB → `/config/led_color_rgb`
  - Modo de alarma: `sound|light|both` → `/config/alarm_mode`

Escritura de config (RTDB)
```ts
import { getDatabase, ref, update } from 'firebase/database';

export async function updateDeviceConfig(deviceID: string, partial: Partial<{ led_intensity: number; led_color_rgb: [number,number,number]; alarm_mode: 'sound'|'light'|'both'; }>) {
  const rdb = getDatabase();
  await update(ref(rdb, `devices/${deviceID}/config`), partial as any);
}
```

1.6 Flujo del Paciente: Gestión de Cuidadores
- Objetivo: Página “Cuidadores” para invitar por correo y gestionar permisos.
- Invitación: Capturar email del cuidador, crear relación paciente–cuidador en Firestore (colección `relationships`), y enviar correo (vía Cloud Functions/Email provider).
- Permisos: Reglas en Firestore/RTDB para permitir lectura de adherencia por cuidadores autorizados.

Modelo sugerido
- Firestore `relationships/{id}`: { patientId, caregiverEmail, caregiverId?, status: 'pending'|'accepted' }.
- Al aceptar: agregar `caregiverId` y conceder permisos.

1.7 Flujo del Cuidador: Panel Principal (Dashboard)
- Objetivo: Lista de pacientes monitorizados; anillo de adherencia por paciente (solo lectura) con estado verificado en tiempo real.
- Datos: RTDB `devices/{deviceID}/state` + Firestore para metadatos del paciente.
- UI: Reutilizar `DoseRing` con `segments` derivados de alarmas del paciente; escuchar múltiples `deviceID` con listeners paralelos.

1.8 Flujo del Cuidador: Reportes IA
- Objetivo: Página “Reportes IA” con gráfico superpuesto.
- Librería: `react-native-chart-kit` (o `victory-native`).
- Datos:
  - Línea 1: Adherencia verificada (`/adherence_logs` en Firestore o RTDB según implementación)
  - Línea 2: Salud autoinformada (p.ej., “Nivel de Dolor” almacenado en `reports`)
- Insight: Mostrar una observación simple basada en correlación (p.ej., “Mayor dolor en días con dosis omitidas”).

Ejemplo básico (dataset)
```ts
const adherence = [ { ts: 1710000000000, missed: 1 }, { ts: 1710086400000, missed: 0 } ];
const pain = [ { ts: 1710000000000, level: 7 }, { ts: 1710086400000, level: 3 } ];
// Calcular correlación simple por día y generar insight textual.
```

1.9 Funcionalidad Central de Sincronización (Digital Shadow)
- Objetivo: Servicio de sincronización Firebase en toda la app.
- Escritura (Control): cualquier acción de hardware escribe en `devices/{deviceID}/config` (RTDB).
- Lectura (Estado): listeners en tiempo real (`onValue`) sobre `devices/{deviceID}/state`.
- Actualización de UI: al detectar cambio, actualizar estado global y reflejarlo instantáneamente.

Estado global (Redux)
- Este proyecto usa Redux Toolkit + Redux Persist. Para el “Digital Shadow” del dispositivo (estado en tiempo real desde RTDB), se implementa `deviceSlice` con thunks para iniciar/detener listeners y actualizar configuración.

Ejemplo Redux (deviceSlice)
```ts
// src/store/slices/deviceSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { rdb } from '../../services/firebase';
import { ref, onValue, update } from 'firebase/database';

type DeviceState = {
  is_online: boolean;
  battery_level: number;
  current_status: 'PENDING'|'DOSE_TAKEN'|'DOSE_MISSED';
  last_event_at?: number;
};

let unsubscribe: (()=>void) | null = null;

export const startDeviceListener = createAsyncThunk(
  'device/startListener',
  async (deviceID: string, { dispatch }) => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    unsubscribe = onValue(ref(rdb, `devices/${deviceID}/state`), (snap) => {
      const val = snap.val() as DeviceState | null;
      if (val) dispatch(setDeviceState(val));
    });
    dispatch(setDeviceID(deviceID));
    dispatch(setListening(true));
  }
);

export const stopDeviceListener = createAsyncThunk('device/stopListener', async (_, { dispatch }) => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  dispatch(setListening(false));
});

export const updateDeviceConfig = createAsyncThunk(
  'device/updateConfig',
  async ({ deviceID, partial }: { deviceID: string; partial: Partial<{ led_intensity: number; led_color_rgb: [number,number,number]; alarm_mode: 'sound'|'light'|'both'; }> }) => {
    await update(ref(rdb, `devices/${deviceID}/config`), partial as any);
  }
);

const slice = createSlice({
  name: 'device',
  initialState: { listening: false } as { deviceID?: string; state?: DeviceState; listening: boolean; error?: string|null },
  reducers: {
    setDeviceID: (state, { payload }) => { state.deviceID = payload; },
    setDeviceState: (state, { payload }) => { state.state = payload; },
    setListening: (state, { payload }) => { state.listening = payload; },
  },
});

export const { setDeviceID, setDeviceState, setListening } = slice.actions;
export default slice.reducer;
```

Uso en componentes
```ts
// app/patient/home.tsx (ejemplo)
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startDeviceListener, stopDeviceListener } from '../../src/store/slices/deviceSlice';

export default function PatientHome() {
  const dispatch = useDispatch();
  const deviceID = 'my-device-id';
  const deviceState = useSelector((s: any) => s.device.state);

  useEffect(() => {
    dispatch(startDeviceListener(deviceID) as any);
    return () => { dispatch(stopDeviceListener() as any); };
  }, [deviceID]);

  return null; // Render UI usando deviceState
}
```

Diagrama (Digital Shadow)
```
User Action → Write config → RTDB /devices/{id}/config → Firmware acts
Firmware → Update state → RTDB /devices/{id}/state → App listener → Global state → UI updates
```

Seguridad (RTDB)
- Reglas: permitir lectura/escritura solo a usuario autenticado dueño del dispositivo o cuidador autorizado.
- Validar rangos (`led_intensity` 0–1023, `led_color_rgb` 0–255, `alarm_mode` en lista permitida).

Notas de Integración
- Añadir export de RTDB en `src/services/firebase/index.ts` si se usa Realtime Database: `export const rdb = getDatabase(app);`
- Mantener Firestore para datos estructurados (medicamentos, métricas, relaciones) y RTDB para estado/config de hardware.
