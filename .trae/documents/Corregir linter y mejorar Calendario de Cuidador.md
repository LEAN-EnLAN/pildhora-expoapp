## Objetivo
- Resolver los errores de lint y tipado en `app/caregiver/calendar/index.tsx` manteniendo funcionalidad.
- Mejorar la página de calendario para: disponibilidad y “citas”, diseño responsivo, manejo de conflictos de fecha/hora, accesibilidad, y exactitud temporal.

## Diagnóstico de errores actuales
- Falta de imports y estados: `useDispatch`, `selectedPatientId`, `allEvents`, `monthRange`, `selectedDate`, `mutate`, `eventsLoading`, `eventsError`, `setRefreshing`, `refreshing`.
- Tipos: `MedicationEvent` exige `caregiverId`; el mapeo de `intakes` no lo incluye.
- Propiedad inexistente: uso de `e.status` en cálculos (no existe en `MedicationEvent`).
- Parámetros con `any`: callbacks de filtros y mapeos.
- Tokens/Componentes no importados: `colors`, `spacing`, `borderRadius`, `typography`, `ScreenWrapper`, `Container`, `ErrorState`, `OfflineIndicator`, `MedicationEventCard`, `CalendarView`, `AdherenceChart`.
- Tipos auxiliares: `AdherenceDay` requerido por `weeklyStats`.
- Referencias clave para revisión: `index.tsx:116–118` (uso de `status`), `index.tsx:19` (useDispatch), `index.tsx:61,66,165` (uso de `allEvents`).

## Correcciones de lint y estilo (sin alterar funcionalidad)
- Imports:
  - `import { useDispatch, useSelector } from 'react-redux'` (reemplazar línea `index.tsx:4,19`).
  - `import { colors, spacing, borderRadius, typography } from '../../../src/theme/tokens'`.
  - Componentes: `ScreenWrapper`, `Container`, `ErrorState`, `OfflineIndicator` desde `src/components/...`.
  - Calendario: `CalendarView`, `AdherenceChart` desde `src/components/caregiver/calendar/...`.
  - Hooks/Utils: `useCollectionSWR` (`src/hooks/useCollectionSWR`), `categorizeError` (`src/utils/errorHandling`), `buildEventQuery` (`src/utils/eventQueryBuilder`).
  - Tipos: `AdherenceDay` (`src/components/caregiver/calendar/AdherenceChart.tsx`).
- Estados y derivadas:
  - `const [selectedDate, setSelectedDate] = useState<Date>(new Date())`.
  - `const [refreshing, setRefreshing] = useState(false)`.
  - `const monthRange = useMemo(() => ({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }), [currentDate])`.
- Paciente seleccionado y lista de pacientes:
  - Cargar `selectedPatientId` desde `AsyncStorage` (`@caregiver_selected_patient`) para alinear con `app/caregiver/dashboard.tsx`.
  - Obtener `patients` con `useLinkedPatients({ caregiverId: user?.id, enabled: !!user?.id })` para mostrar nombre del paciente.
- Datos de eventos:
  - Construir query con `buildEventQuery(db, user?.id, { patientId: selectedPatientId, dateRange: { start: monthRange.start, end: monthRange.end } })`.
  - `const { data: allEvents = [], isLoading: eventsLoading, error: eventsError, mutate } = useCollectionSWR<MedicationEvent>({ query, cacheKey: \`events:${user?.id}:${selectedPatientId}\` })`.
- Mapeo correcto de intakes a `MedicationEvent`:
  - Incluir `caregiverId: user?.id || getAuth().currentUser?.uid || ''`.
  - Mapear `intake.status`→`eventType`: `taken→dose_taken`, `missed→dose_missed`, `skipped→dose_skipped`.
- Eliminar usos de `e.status`:
  - Crear helper `const getEventStatus = (e: MedicationEvent) => e.eventType === 'dose_taken' ? 'taken' : e.eventType === 'dose_missed' ? 'missed' : e.eventType === 'dose_skipped' ? 'skipped' : 'other'`.
  - Reemplazar contadores y heurísticas por `getEventStatus(e)` en `adherenceData`, `selectedDayStats`, `weeklyStats`.
- Tipado explícito en callbacks:
  - Donde aparece `e` sin tipo (p.ej. `index.tsx:165,170`), tipar como `MedicationEvent`.
- Accesibilidad básica en FlatList y contenedores: `accessible`, `accessibilityRole`, `accessibilityLabel`.

## Disponibilidad y “citas” del cuidador (visualización)
- No existen modelos de “appointments” en el repo; adoptaremos una representación visual basada en tareas del cuidador:
  - Fuente: `Task` con `dueDate` desde `src/services/firebase/tasks.ts`.
  - Mostrar en el `CalendarView` dots secundarios por día que tenga tareas (tratadas como “citas” proxy).
  - Sección "Agenda del cuidador" encima de la lista diaria: listar tareas del día con hora (`dueDate`) y paciente asociado si existe.
- Disponibilidad:
  - Añadir banda informativa de disponibilidad configurable mínima (bloques locales) hasta que exista modelo backend. Ej.: rangos `08:00–12:00`, `14:00–18:00` en preferencias locales.
  - Visualizar como overlay tenue en el grid del calendario y como texto en el encabezado del día.

## Diseño responsivo
- Ajustes de estilos con `flex` y `gap` de `spacing`, evitando valores fijos de ancho/alto.
- Usar `numberOfLines` y truncado en encabezados de paciente.
- Adoptar `contentContainerStyle` y `elevation/shadow` controlados por tokens.
- Validar en tamaños chicos/medianos/grandes (teléfonos y tablets) con estilos adaptables.

## Manejo de conflictos de fecha/hora
- Al seleccionar una hora (cuando proceda en creación/edición futura), validar contra:
  - Slots de disponibilidad locales.
  - Tareas del día (“citas” proxy) y eventos de medicación de paciente seleccionado.
- Mostrar `ErrorState` con mensaje claro y opción de reintentar o elegir otro horario.

## Accesibilidad
- Añadir `accessibilityLabel`, `accessibilityHint` y `accessibilityRole` en:
  - Botón de cambio de mes, selección de día en `CalendarView`.
  - Tarjetas (`MedicationEventCard`) y elementos de la “Agenda del cuidador”.
- Soporte de teclado (Expo web): navegación por días con flechas y Enter para selección, usando `onKeyDown`.

## Zona horaria y exactitud
- Normalizar los cálculos usando límites del día en hora local (`setHours(0,0,0,0)` / `23:59:59`).
- Al recibir `Firestore.Timestamp`, convertir a `Date` y comparar por milisegundos.
- Formateo con `date-fns` + `locale: es`, manteniendo coherencia local del dispositivo. Sin nuevas dependencias.

## Pruebas y verificación
- Linter: ejecutar y corregir hasta cero advertencias/errores.
- Funcionalidad:
  - Suscripción de `intakes` por paciente, mezcla con eventos y filtrado por mes/día.
  - Pull-to-refresh (`RefreshControl` + `mutate`) y reintentos con `ErrorState`.
- UI:
  - Render correcto de `CalendarView`, `AdherenceChart`, encabezados y lista diaria.
  - Visualización de agenda del cuidador (tareas) y overlay de disponibilidad.
- Accesibilidad:
  - Verificación de roles/labels y navegación por teclado en web.
- Temporalidad:
  - Validar días con eventos en distintos husos horarios simulando timestamps UTC vs local.

## Riesgos y compatibilidad
- La visualización de “citas” basada en tareas es un puente temporal; cuando exista `Appointment`, migraremos mapeos.
- Sin nuevas dependencias: se respeta el stack actual y estilos.
- Cambios circunscritos a la pantalla de calendario y componentes relacionados.

Si confirmas, procedo con las correcciones de código, la integración visual y las pruebas indicadas.