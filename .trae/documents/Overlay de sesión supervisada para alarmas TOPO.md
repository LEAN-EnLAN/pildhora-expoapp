## Objetivo
Implementar un overlay de sesión supervisada que reaccione a `topo` (true/false) con animaciones profesionales, capa superior persistente y registro de confirmación, garantizando 60fps, accesibilidad y respuesta inmediata.

## Ubicación y estado existentes
- Lectura de `topo` en tiempo real: `src/components/shared/TestTopoButton.tsx:49–57`
- Disparo de `topo`: `src/services/deviceCommands.ts:93–96`
- Dashboard supervisado (cuidador): `app/caregiver/dashboard.tsx:423–436` (usa `TestTopoButton` y tiene `selectedPatient.deviceId`)
- Home del paciente y agenda diaria: `app/patient/home.tsx:375–453` (construye dosis del día) y acciones de registro: `app/patient/home.tsx:510–588` (tomar) / `590–628` (omitir)
- Modal de alto nivel para capas: `src/components/ui/Modal.tsx` (overlay con `RNModal` + animación)

## Componentes nuevos
- `TopoSessionOverlay.tsx` (nuevo en `src/components/session/`)
  - Capa fullscreen sobre toda la UI usando `RNModal` (transparente) para asegurar visibilidad.
  - Estado “alarma” cuando `topo === true`:
    - Animación impactante (radial pulse + glow + shake suave del icono) con `react-native-reanimated` y `useNativeDriver`.
    - Paleta de alerta (rojos/naranjas), mensaje grande: “¡Hora de tomar tu medicamento!”.
    - Botón accesible “Confirmar toma” (alto contraste) y opción “Silenciar efectos”.
    - Sonido opcional: activar buzzer del dispositivo con `triggerBuzzer(deviceId, true)`; si está silenciado, no se envía.
    - Persistente hasta confirmación.
  - Estado “confirmación” cuando `topo` pasa a false:
    - Animación positiva 3–5s (checkmark bounce + brillo verde) y auto-cierre.
    - No bloquea la UI; la interacción general permanece responsive.
  - Accesibilidad: `accessibilityLabel`, contraste AA, toggle “Desactivar efectos visuales/sonoros” (persistido en `AsyncStorage`).
  - Responsivo: tamaños escalados con `Dimensions` y tokens (`typography`, `spacing`).

## Hook de sesión
- `useTopoSession(deviceId)` (nuevo en `src/hooks/`)
  - Suscribe a `devices/{deviceId}/commands/topo` (RTDB) y expone:
    - `isAlarm` (boolean), `confirm()` (envía fin de alarma) y `settings` (sonido/efectos).
  - Confirmación:
    - Envía `sendDeviceCommand(deviceId, { topo: false })` o `clearDeviceCommands(deviceId)`; respeta la auto-desactivación existente, pero funciona independientemente.

## Registro de la toma
- `recordIntakeFromTopo(patientId, deviceId)` (nuevo en `src/services/`)
  - En modo supervisado, al confirmar:
    - Obtiene la dosis programada más cercana de hoy (reutiliza lógica de `home.tsx` para emparejar `medications.times` con `intakeRecords` en ±5 min).
    - Si encuentra slot pendiente: crea `intakeRecords` con `status: TAKEN`, `scheduledTime` reconstruido y `takenAt` ahora.
    - Si no hay slot (edge case): crea un registro genérico con `medicationName: 'Desconocida'` y marca `source: 'supervised_session'` para auditoría.

## Integración en pantallas
- Caregiver dashboard: renderizar `TopoSessionOverlay` cuando exista `selectedPatient?.deviceId` y suscribirse al `topo` de ese dispositivo.
  - Punto de inserción: `app/caregiver/dashboard.tsx` dentro de `ScreenWrapper` antes del contenido (`289–317`).
- Home del paciente: opcionalmente renderizar `TopoSessionOverlay` si el paciente está en modo supervisado y tiene dispositivo activo (`app/patient/home.tsx:354–369` para `activeDeviceId`).

## Rendimiento y fluidez
- Animaciones con `react-native-reanimated` (~4.1.1 ya configurado en `babel.config.js:5–7`) y `useNativeDriver` para 60fps.
- Pre-carga de assets (gradientes) y evitar re-render excesivo; usar `memo` y `useCallback`.
- Modal usa `Animated.parallel`/spring optimizado; overlay mínimo trabajo por frame.

## Accesibilidad y opciones
- Contraste alto en textos/botones; tamaños mínimos táctiles.
- Toggle “Desactivar efectos” y “Silenciar” disponible en el overlay; persistir en `AsyncStorage` por usuario.
- Soporte screen sizes con límites de escala y tipografía.

## Éxito y verificación
- Carga instantánea: el overlay se monta en memoria y se muestra apenas `topo === true`.
- Diferenciación clara: paletas/animaciones distintas para alarma y confirmación.
- Registro correcto: se inserta en `intakeRecords` al confirmar y se mantiene la lógica de auto-desactivación.
- UI responsive: Modal no bloquea la hebra JS; botones siguen fluidos.
- Pruebas manuales:
  - Activar `topo`: `src/components/shared/TestTopoButton.tsx:94–111` o `triggerTopo(deviceId)` y verificar overlay.
  - Confirmar: ver animación verde 3–5s y aparición del registro en historial (`startIntakesSubscription`).
  - Silenciar/Desactivar efectos: confirmar persistencia en reinicio.

## Cambios previstos (archivos)
- `src/components/session/TopoSessionOverlay.tsx` (nuevo)
- `src/hooks/useTopoSession.ts` (nuevo)
- `src/services/intakeFromTopo.ts` (nuevo)
- `app/caregiver/dashboard.tsx` (incrustar overlay; usa `selectedPatient.deviceId`)
- `app/patient/home.tsx` (opcional incrustar overlay cuando haya `activeDeviceId` y modo supervisado)

## Riesgos y mitigación
- Duplicado de registros: se usa matching ±5 min contra `intakeRecords` antes de crear.
- Sonidos locales: se prioriza `triggerBuzzer` del dispositivo para no añadir paquetes; si se requiere audio local, se evalúa `expo-av` en una fase posterior.
- Consumo de batería: animaciones optimizadas y pausadas al cerrar.

¿Confirmamos este plan para proceder con la implementación?