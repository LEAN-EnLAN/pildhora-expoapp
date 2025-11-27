## Objetivo y Alcance
- Unificar el diseño visual y la experiencia de todas las pantallas (viejas y nuevas) del app móvil en React Native/Expo asegurando consistencia de estilos, navegación, estados y accesibilidad.
- Reducir deuda visual y técnica: eliminar librerías UI redundantes, consolidar tokens, estandarizar componentes y patrones.

## Inventario y Diagnóstico
- Catalogar pantallas por dominio y estado:
  - Paciente: `app/patient/*` (home, medications, history, provisioning, device-settings)
  - Cuidador: `app/caregiver/*` (dashboard, patients, tasks, events, medications por paciente)
  - Auth: `app/auth/*` (login, signup)
- Mapear qué pantallas usan tokens (`src/theme/tokens.ts`) y UI kit (`src/components/ui`), y cuáles no.
- Identificar divergencias: layouts diferentes, espaciados ad-hoc, headers no uniformes, estados faltantes (loading/empty/error), mezcla de animaciones.

## Sistema de Diseño Unificado
- Adoptar oficialmente tokens en `src/theme/tokens.ts` como fuente única: `colors`, `spacing`, `typography`, `borderRadius`, `shadows`.
- Definir variantes de color semántico (primary, success, warning, error) y roles (text, background, surface, outline) y asegurar su uso consistente.
- Establecer escalas de espaciado (4/8/12/16/24/32) y tipografía (H1–H6, Body, Caption) con mapping fijo.

## Tokens y Temas
- Normalizar light/dark: crear `theme.light.ts` y `theme.dark.ts` derivados de `tokens` (si ya existe, reforzar su uso) y un `ThemeProvider` para RN.
- Ajustar contrastes (WCAG AA) en colores de texto y fondo; fijar mínimos en botones y enlaces.
- Preparar soporte de alto contraste para accesibilidad.

## Biblioteca de Componentes
- Consolidar `src/components/ui` como kit base: `Button`, `Input`, `Select`, `Checkbox`, `Switch`, `Card`, `Modal`, `Toast`, `Chip`, `Badge`, `Tabs`, `AppBar`, `ListItem`, `Skeleton`.
- Para cada componente:
  - Props estandarizadas (size: sm/md/lg, variant: solid/outline/ghost, tone: primary/success/warning/error, disabled, loading).
  - Estados definidos (default, hover/focus, pressed, disabled, loading, error).
  - Accesibilidad: `accessibilityRole`, `accessibilityLabel`, `focusable`, tamaño objetivo táctil ≥ 44px.
- Extraer estilos inline a `StyleSheet` usando tokens y evitar estilos ad-hoc.

## Estados, Accesibilidad y Vacíos
- Establecer patrón común de estados:
  - Loading: skeletons en listas/cards; spinners en acciones.
  - Empty: mensajes con ícono, acción primaria sugerida.
  - Error: banners o toasts con acción de retry.
  - Disabled: opacidad y bloqueo táctil.
- Revisar accesibilidad por pantalla: navegación por teclado (si aplica), lectura por screen readers, orden lógico de foco.

## Navegación y Encabezados
- Uniformar headers con `expo-router`:
  - `app/_layout.tsx`: reglas globales de header (altura, tipografía, colores, back button).
  - Sublayouts (`app/patient/_layout.tsx`, `app/caregiver/_layout.tsx`): variantes según dominio, pero con patrón común.
- Estandarizar `headerLeft` y `headerRight` (acciones, iconografía, spacing) y transiciones (`slide_from_right`).
- Completar deep linking: replicar config de `caregiver` hacia paciente en `src/utils/navigation.ts`.

## Layout y Espaciado
- Definir grid flexible (columna principal, gutters fijos) para RN con `View` + `spacing`.
- Patrones de contenedor: `ScreenContainer`, `Section`, `Panel` con padding/spacing estándar.
- Evitar nesting excesivo; usar `gap` pattern (simulado por spacing) consistente.

## Tipografía e Iconografía
- Tipografía: asignar roles H1–H6, Body, Caption con tamaños y pesos según tokens.
- Iconos: `@expo/vector-icons` (Ionicons): set oficial, tamaños y colores por rol.
- Line-height y letter-spacing consistentes por rol.

## Animaciones y Rendimiento
- Elegir una estrategia primaria: `react-native-reanimated` para interacciones complejas; `Animated` solo en casos simples.
- Definir duraciones/easings estándar (ej. 150/250/350ms; ease-in-out, spring) y aplicarlas en toda la UI.
- Evitar mezclar ambas en la misma pantalla sin justificación.

## Refactor de Pantallas (por dominio)
- Paciente:
  - `home`: asegurar jerarquía visual (hero de próxima dosis, inventario, alertas) con Cards consistentes.
  - `medications/*`: unificar wizard y detalle con componentes de formulario comunes; migración de campos antiguos.
  - `history`: listas con `ListItem` y estados empty/loading uniformes.
  - `device-*`: provisioning y settings con pasos y banners consistentes.
- Cuidador:
  - `dashboard`: paneles y métricas con `Card`, filtros uniformes.
  - `patients`, `tasks`, `events`: listas con filtros y acciones con UI estándar.
  - `medications/[patientId]/*`: espejar patrones del dominio paciente.
- Auth:
  - `login`, `signup`: inputs, validaciones, errores y botones uniformes; accesibilidad reforzada.

## Lineamientos para Contenido Generado por IA
- Prohibir estilos inline generados; exigir uso de tokens y componentes UI.
- Validar props y estados permitidos; rechazar variantes fuera de catálogo.
- Checklist de consistencia automática (lint) para detectar violaciones de tokens.

## Pruebas y QA Visual
- Unit tests de componentes UI (render, estados, accesibilidad).
- Capturas de snapshot por pantalla (jest + react-test-renderer) y pruebas de navegación (expo-router testing).
- Pruebas manuales de dark/light y alto contraste.
- Opcional: pruebas de regresión visual con `reg-suit`/`lokijs` equivalente en RN (si se integra).

## Limpieza de Dependencias
- Retirar `react-native-paper` y `react-native-elements` si no se usan.
- Desactivar/retirar `nativewind`; mantener `StyleSheet` + tokens como estándar.
- Consolidar animaciones; evitar dependencias duplicadas.

## Entregables y Criterios de Aceptación
- Tokens unificados y documentados en código.
- Kit de componentes con variantes y estados completos.
- Headers y navegación consistentes en todos los dominios.
- Pantallas refactorizadas con estados (loading/empty/error) y accesibilidad.
- Deep linking completo y probado para paciente y cuidador.
- Eliminación de dependencias no usadas; build estable.

## Riesgos y Mitigaciones
- Riesgo de ruptura en flujos críticos (medications, provisioning): refactor por etapas y pruebas por paso.
- Divergencia de estilos reintroducida por contribuciones: linting y PR checklist obligatorio.
- Performance en listas grandes: uso de `FlatList` optimizado y `Skeleton` en cargas.

## Plan de Implementación por Sprints
- Sprint 1: Auditoría, definición de tokens, ThemeProvider, headers globales.
- Sprint 2: Kit de componentes base (Button, Input, Card, Modal, Toast) y estados.
- Sprint 3: Refactor auth + paciente home; deep linking paciente.
- Sprint 4: Wizard de medicamentos y pantallas relacionadas (paciente y cuidador).
- Sprint 5: Caregiver dashboard, patients, tasks, events.
- Sprint 6: Provisioning y device settings.
- Sprint 7: Animaciones unificadas, accesibilidad avanzada, limpieza de dependencias.

## Gobernanza y Documentación de Diseño en Código
- Guía de estilos en comentarios de tokens y prop-types de componentes.
- Lint rules para tokens y estilos.
- Ejemplos de uso en `examples/` dentro del repo (no documentación externa).

Una vez apruebes este plan, procedo a preparar los cambios iniciales: reforzar tokens/ThemeProvider, crear/normalizar componentes base y aplicar headers consistentes en layouts de `expo-router`. 💪