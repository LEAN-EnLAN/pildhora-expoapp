## Objetivos
- Reducir desplazamiento en un 90% mediante layout compacto con agrupación lógica, secciones colapsables y pestañas internas.
- Mostrar de un vistazo: paciente seleccionado, estado de conexión del pastillero, adherencia, y línea temporal de eventos recientes.
- Mejorar diseño visual con interfaz moderna, indicadores por color, iconografía clara y respuesta a varios tamaños.
- Optimizar rendimiento: carga <1s, transiciones suaves, fetching eficiente y actualizaciones críticas en ~100ms.

## Hallazgos Clave del Código
- Pantalla actual: `app/caregiver/dashboard.tsx` (estado paciente, conectividad, adherencia, acciones) ref: `app/caregiver/dashboard.tsx:354-446`.
- Navegación con Expo Router Tabs: `app/caregiver/_layout.tsx` ref: `app/caregiver/_layout.tsx:130-228`.
- Datos críticos ya en tiempo real:
  - Conexión dispositivo (RTDB) vía `useDeviceState` y `DeviceConnectivityCard`.
  - Modo autónomo: `usePatientAutonomousMode` y `AutonomousModeBanner` ref: `app/caregiver/dashboard.tsx:471-486`.
  - Adherencia/eventos con Firestore y patrones SWR/cache.
- Persistencia de selección de paciente: `AsyncStorage` clave `@caregiver_selected_patient` ref: `app/caregiver/dashboard.tsx:140-151`.

## Arquitectura de UI Propuesta
- Encabezado persistente (ya presente) mostrando nombre y acciones globales.
- Cinta superior de estado (una sola fila, sin scroll):
  - "Paciente actual" con selector compacto y resaltado de selección.
  - "Pastillero": indicador en tiempo real (conectado/último visto/batería).
  - "Adherencia hoy": % y badges de fallos/éxitos.
- Secciones colapsables con auto-resumen:
  - Eventos recientes (vista condensada en chips/mini cards, 5 ítems máx.).
  - Acciones rápidas (gestión de dispositivo, medicación, tareas).
- Pestañas internas (segmentadas) dentro del dashboard para evitar scroll:
  - `Hoy` | `7 días` | `Dispositivo` (cambia el contenido central, mantiene la cinta superior visible).
- Diseño responsive: rejilla fluida basada en breakpoints (teléfono compacto vs. phablet), reorganizando tarjetas para minimizar altura.

## Diseño Visual
- Paleta y tokens existentes (`colors`, `spacing`, `typography`) para consistencia.
- Indicadores por color: verde (OK), amarillo (advertencia), rojo (crítico), azul (info). Iconos `Ionicons` ya usados.
- Uso moderado de espacio en blanco y tarjetas con densidad ajustada (listas compactas, líneas de 1–2).
- Microanimaciones (fade/slide con `useNativeDriver`) para expandir/colapsar y transiciones de pestañas.

## Datos y Tiempo Real
- Consolidación de lecturas en una "Tarjeta de Resumen":
  - `statusSummary` (propuesta): documento por paciente con campos agregados (conexión, adherencia hoy, último evento) para carga <1s.
  - Actualizaciones:
    - Conexión: RTDB `devices/{deviceId}/state` → reflejo inmediato.
    - Adherencia: suscripción a `intakeRecords` (ya existe) con cálculo local del porcentaje.
    - Eventos: consulta Firestore limitada (últimos N) con cache corto.
- Estrategia de fetching:
  - Prefetch de paciente seleccionado y su dispositivo al montar.
  - SWR con TTL corto y revalidación en foco.
  - Debounce de 50–100ms para difusiones UI, evitando parpadeos.

## Rendimiento
- Carga inicial:
  - Skeletons existentes para tarjetas críticas.
  - Lectura en paralelo: paciente + estado dispositivo + adherencia + últimos eventos.
- Minimizar re-render:
  - Memoización por `patientId`, listas virtualizadas si se requieren.
  - Separación de secciones y `React.memo` en tarjetas.
- Medición:
  - Marcadores de tiempo `performance.now()` y logs de métricas (solo en dev) para <1s y 100ms.

## Accesibilidad (WCAG 2.1 AA)
- Roles y etiquetas `accessibilityRole`/`Label` coherentes (ya hay en dashboard).
- Contraste de color ≥ 4.5:1, foco visible, orden de tabulación lógico.
- Área táctil mínima 44×44, ayudas contextuales con descripciones breves.
- Soporte de lectores de pantalla: descripciones de estado y cambios en vivo.

## Flujo de Usuario
- Ingreso → Encabezado + cinta superior fija.
- Selección rápida de paciente (persistente) → tarjetas se actualizan.
- Revisión de estados críticos → acciones directas.
- Expansión opcional de secciones para detalle sin navegar.
- Pestañas internas para periodos/estado de dispositivo sin depender del scroll.

## Wireframes y Mockups
- Wireframes de baja fidelidad (3 variantes de breakpoints):
  - Teléfono pequeño
  - Teléfono grande
  - Tablet vertical
- Mockups de alta fidelidad con tokens actuales y iconos `Ionicons`.
- Entregables en figma y referencias .figma locales existentes.

## Implementación
- Crear contenedor `CaregiverDashboardCompact` (reemplaza el contenido en `dashboard.tsx` manteniendo `ScreenWrapper` y `Container`).
- Componentes:
  - `StatusRibbon` (paciente, dispositivo, adherencia) fijo arriba.
  - `SegmentedTabs` (`Hoy|7 días|Dispositivo`).
  - `CollapsibleSection` (eventos, acciones rápidas) con animaciones.
  - Reutilizar `PatientSelector`, `DeviceConnectivityCard`, `LastMedicationStatusCard`, `QuickActionsPanel` con variantes compactas.
- Datos:
  - Prefetch con hooks actuales; añadir agregación de `statusSummary` si es necesario para reducir latencia.
- Navegación:
  - Mantener Tabs externas de `caregiver/_layout.tsx`; evitar crear nuevas rutas.
- Medición y pruebas:
  - Instrumentar tiempos de carga y actualización.

## Métricas y Verificación
- Desplazamiento: medir profundidad media antes/después (evento analytics).
- Latencia: medir tiempo desde cambio de `patientId` a render final.
- Satisfacción: test de usabilidad con tareas comunes, objetivo ≥95%.
- Visibilidad: checklist de que toda info crítica cabe en un viewport.

## Entregables
- Wireframes y mockups aprobados.
- Implementación de frontend responsive con secciones colapsables y pestañas internas.
- Optimización de fetching y tiempo real.
- Reporte de métricas post-implementación con evidencia de objetivos.