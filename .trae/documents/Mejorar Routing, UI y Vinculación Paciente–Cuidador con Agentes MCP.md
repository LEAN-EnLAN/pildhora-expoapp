## Objetivo
- Añadir un botón de routing pequeño y claro entre "Ajustes de Dispositivo" y "Provisionamiento".
- Refinar ambas pantallas con UI más descriptiva y accesible, sin romper la funcionalidad existente.
- Robustecer la vinculación Paciente–Cuidador para evitar errores de "missing permissions" y "unauthenticated".

## Fase 1: Botón y Routing (Agente React Native)
- Ubicar el botón en el header de cada pantalla:
  - En `app/patient/device-settings.tsx`: botón a `router.push('/patient/device-provisioning')`.
  - En `app/patient/device-provisioning.tsx`: botón a `router.push('/patient/device-settings')`.
- Usar `Ionicons` con iconos claros (p. ej. `wifi-outline` y `settings-outline`), `accessibilityLabel` en español y tokens de estilo existentes.
- Mantener `expo-router` como mecanismo de navegación para coherencia.
- Pruebas rápidas: navegar en ambas direcciones y validar que no produce pantallas en blanco ni estados inconsistentes.

## Fase 2: Mejora de UI/UX (Agente Frontend)
- Microcopy claro en español y conciso:
  - Títulos: “Gestión de Dispositivo” y “Configurar Dispositivo”.
  - Subtítulos: instrucciones breves de qué hace cada pantalla.
- Añadir feedback visual consistente (mensajes de éxito/error ya existentes) y accesibilidad:
  - `accessibilityLabel`/`Role`, tamaños de toque suficientes, contraste según `colors`.
- Evitar contenido fuera de pantalla: revisar paddings/márgenes y `ScrollView`.
- Mantener patrón de componentes (`Card`, `Button`, `Input`, `Collapsible`), sin introducir librerías nuevas.
- Entregar cambios mínimos de estilo y texto, sin tocar lógica de negocio.

## Fase 3: Vinculación Paciente–Cuidador robusta (Agente Firebase)
- Endurecer la lógica de vínculo en `src/services/deviceLinking.ts` y reglas:
  - Refrescar ID Token antes de operaciones críticas.
  - Escribir/actualizar:
    - `deviceLinks`: `{ deviceId, userId, role, status: 'active', linkedAt }`.
    - `devices`: `linkedUsers[userId]=role`, `primaryPatientId` si `role==='patient'`.
    - `users[userId].deviceId`: set/clear según link/unlink.
  - RTDB: `users/{userId}/devices/{deviceId}`: `true/null`.
- Reglas de Firestore sugeridas (sin aplicar aún):
  - Permitir al usuario autenticado escribir solo sus propios `deviceLinks` y actualizar su `users/{uid}`.
  - Restringir `devices` a actualizaciones de campos específicos cuando `linkedUsers[uid]` ya existe, o mediante Cloud Functions.
- Opcional (recomendado): migrar link/unlink a Cloud Functions para evitar "permission-denied" en clientes:
  - `linkDeviceToUser` y `unlinkDeviceFromUser` verificados por auth en backend.
- Pruebas: vincular y desvincular con logs, validar que Redux se rehidrata mediante `checkAuthState` después de cada operación.

## Invocaciones de Agentes MCP (tras tu confirmación)
- React Native Pro: "Agregar botón de navegación en headers de device-settings y device-provisioning, usando expo-router y Ionicons, con labels accesibles en español."
- Frontend Design Researcher: "Mejorar microcopy y accesibilidad en ambas pantallas, mantener tokens y componentes existentes, evitar contenido fuera de pantalla."
- Firebase Sync Wizard: "Alinear frontend con Firestore y RTDB para vinculación Paciente–Cuidador; asegurar actualización de `users.deviceId`, `deviceLinks`, `devices.linkedUsers`, y limpieza RTDB; proponer reglas para evitar permission-denied/unauthenticated." 

## Validación
- Ejecutar el flujo completo: Settings ↔ Provisioning.
- Vincular y desvincular dispositivo, verificar estado en UI y en logs.
- Comprobar que no hay errores de permisos ni autenticación.

¿Confirmas que procedamos con estas tres invocaciones a los agentes MCP y la implementación descrita?