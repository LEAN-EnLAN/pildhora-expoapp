## Objetivos y Alcance
- Implementar una barra de navegación inferior moderna, con iconos centrados y animaciones suaves.
- Basar la navegación en Bottom Tabs (Expo Router usa React Navigation internamente) y mostrar solo pantallas autorizadas del cuidador.
- Ajustar el header del cuidador para alineación perfecta, micro‑interacciones y accesibilidad.
- Mantener 60fps, áreas táctiles ≥ `48px`, y compatibilidad con `react-native 0.81.5`.

## Arquitectura Actual (Referencia)
- Tabs del cuidador en `app/caregiver/_layout.tsx` con header persistente `src/components/caregiver/CaregiverHeader.tsx`.
- Tema y branding: `src/theme/tokens.ts`; animaciones: `src/theme/motion.ts`.
- Rutas auxiliares ocultas con `options={{ href: null }}`.

## Implementación del Tab Bar Personalizado
- Crear `src/navigation/CaregiverTabBar.tsx` sin nuevas dependencias.
- Usar `@react-navigation/elements` (`PlatformPressable`, `Text`), `useTheme` y `useLinkBuilder` para soporte web.
- Diseñar ítems con:
  - Área mínima `48x48` y `hitSlop` en móvil.
  - Iconos `Ionicons` centrados vertical y horizontalmente.
  - Estados activo/inactivo con tokens (`colors.primary`, `colors.text`, `colors.surface`).
  - Indicador de foco con fondo y sombra sutil.
  - Accesibilidad: `accessibilityRole="tab"`, `accessibilityState={{ selected }}`, `accessibilityLabel` y `testID` desde `options`.
- Animaciones de foco con `react-native-reanimated` (`withTiming`/`withSpring`) usando transform/opacity para 60fps.

## Integración en el Layout del Cuidador
- Inyectar en `app/caregiver/_layout.tsx` vía `tabBar={(props) => <CaregiverTabBar {...props} />}`.
- Definir `screenOptions` consistentes:
  - `headerShown: false` (header persistente)
  - `tabBarHideOnKeyboard: true`
  - `detachInactiveScreens: true`
  - Altura y padding del tab bar para centrar iconos.
- Allowlist de pestañas visibles: `dashboard`, `tasks`, `patients`, `events`, `settings` con `title`, `tabBarAccessibilityLabel` y (si aplica) `tabBarLabel`.
- Mantener rutas auxiliares (p.ej., `medications`, `device-connection`, `add-device`, `edit-profile`, `reports`) con `options={{ href: null }}`.

## Ajustes del Header y Wrapper
- Revisar `src/components/caregiver/CaregiverHeader.tsx` para centrado vertical, spacing con `spacing` tokens y micro‑interacciones (opacity/translateY) usando `src/theme/motion.ts`.
- Afinar `src/components/caregiver/ScreenWrapper.tsx` para padding/insets correctos y no solapar header/tab bar en dispositivos con y sin notch.

## Accesibilidad y Responsividad
- Etiquetas: `accessibilityLabel`, `accessibilityHint` y roles adecuados en tabs.
- Navegación por teclado en web: `href` y `onKeyDown` para activar con `Enter`/`Espacio`.
- Contraste AA verificado con `colors` del tema.
- Layout responsive: tamaños y espaciamientos adaptados (smartphone, tablet).

## Rendimiento y Animaciones
- Animaciones solo en transform/opacity evitando re‑layout.
- `React.memo` en ítems del tab bar para reducir re‑renders.
- `detachInactiveScreens: true` para ahorrar memoria.
- Uso de `useMemo`/`useCallback` en listas y handlers.

## Autorización y Exclusión
- Mantener guardias en `app/caregiver/_layout.tsx`: `isAuthenticated` y `user.role === 'caregiver'`.
- En Tabs, mostrar solo pantallas autorizadas; el resto accesibles solo por navegación interna.

## Pruebas y Verificación
- Pruebas manuales en smartphone pequeño/mediano y tablet.
- Validar: áreas táctiles ≥ `48px`, centrado, estados activo/inactivo, animaciones a 60fps.
- Accesibilidad: lector de pantalla (Android/iOS) y teclado en web.
- Confirmar que rutas ocultas no aparecen en la barra.

## Entregables
- Componente de navegación listo para producción: `src/navigation/CaregiverTabBar.tsx` integrado en `app/caregiver/_layout.tsx`.
- Documentación breve de implementación (uso e integración) en la carpeta de docs del proyecto.
- Especificaciones de estilo: colores, tamaños, spacing y criterios de accesibilidad para mantenimiento.

## Implementación realizada
- Se creó `src/navigation/CaregiverTabBar.tsx` con `Pressable`, tokens del tema e iconos `Ionicons`, incluyendo soporte de teclado en web.
- Se integró en `app/caregiver/_layout.tsx` con `tabBar={(props) => <CaregiverTabBar {...props} />}` y `detachInactiveScreens: true`.
- Áreas táctiles mínimas de `48px` en barra e ítems del header.
- Allowlist activa: `dashboard`, `tasks`, `patients`, `events`, `settings`. Rutas auxiliares ocultas con `options={{ href: null }}`.
- Accesibilidad completa: `accessibilityRole="tab"`, `accessibilityLabel`, `accessibilityState` y activación con `Enter/Espacio`.

## Uso
- El layout del cuidador utiliza la barra personalizada por defecto.
- Para añadir una pestaña autorizada, definir `Tabs.Screen` con `options.title` y `tabBarAccessibilityLabel`.
- Para rutas fuera de la barra, usar `options={{ href: null }}`.

## Especificaciones de estilo
- Iconos centrados en contenedores `48x48` con `borderRadius: lg`.
- Activo: `colors.primary[600/700]`; inactivo: `colors.gray[400/500]`; fondo: `colors.surface`.
- Espaciado: `paddingTop: spacing.sm`, `paddingBottom: spacing.md` (iOS: `spacing['2xl']`).
- Animaciones discretas con transform/opacity, sin afectar layout.

## Verificación
- Servidor de desarrollo iniciado y preview web en `http://localhost:8082/`.
- Tabs visibles correctas, centrado vertical, targets ≥ `48px` y navegación accesible.
