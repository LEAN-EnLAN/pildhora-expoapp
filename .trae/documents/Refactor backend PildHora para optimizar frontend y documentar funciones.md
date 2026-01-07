## Objetivos
- Eliminar errores de permisos y fricción entre frontend y backend.
- Unificar y tipar operaciones críticas mediante APIs en Functions.
- Endurecer reglas de seguridad sin romper UX.
- Mejorar rendimiento de consultas y consistencia de datos.
- Documentar cada función/servicio con contratos claros.

## Arquitectura propuesta
- Capa de datos dual, con responsabilidades claras:
  - Firestore: identidad, relaciones, inventario, eventos, tareas.
  - RTDB: estado en tiempo real y comandos de dispositivo.
- Capa API en Cloud Functions:
  - HTTPS/Callable para todas las escrituras sensibles (acciones de dispositivo, inventario, códigos de conexión, vínculos, dismiss de topo).
  - Auditoría centralizada y rate limiting.
- Clientes (app):
  - Reducir `setDoc/updateDoc` directos en colecciones sensibles.
  - Usar servicios que llamen a APIs tipadas con validación.

## Modelo de datos (Firestore)
- `users/{uid}`: `{role, name, email, deviceId?, onboardingComplete, autonomousMode, createdAt, updatedAt}`.
- `deviceLinks/{deviceId}_{uid}`: `{deviceId, userId, role: 'patient'|'caregiver', status: 'active'|'inactive', createdAt, updatedAt}`.
- `devices/{deviceId}`: `{primaryPatientId?, linkedUsers[], desiredConfig?, lastKnownState?, updatedAt}`.
- `medications/{medId}`: `{patientId, name, dosage, trackInventory, currentQuantity, lowQuantityThreshold, schedule, caregiverId?, createdAt, updatedAt}`.
- `intakeRecords/{id}`: `{patientId, medicationId, scheduledTime, status, takenAt?, topoTriggeredAt?, deviceId?, createdAt}`.
- `medicationEvents/{eventId}`: `{patientId, caregiverId, eventType, timestamp, syncStatus}`.
- `criticalEvents/{eventId}`: `{patientId, caregiverId, type, level, timestamp, notificationStatus}`.
- `tasks/{taskId}`: `{caregiverId, title, dueDate, createdAt, status}`.
- `notifications/{id}`: `{userId, title, body, createdAt, delivery}`.
- `connectionCodes/{codeId}`: `{patientId, code, used, expiresAt, createdAt}`.

## RTDB (rutas)
- `devices/{deviceId}/state`: `current_status`, métricas (batería, etc.).
- `devices/{deviceId}/commands`: `topo`, `buzzer`, `led`, `ledColor`, `reboot`.
- `devices/{deviceId}/dispenseEvents/{eventId}`.
- `users/{uid}/devices/{deviceId}` y `devices/{deviceId}/ownerUserId`.

## Reglas de seguridad (refactor)
- Firestore:
  - Principio de mínimo privilegio por rol.
  - Paciente: lectura de cuidadores vinculados vía vista/función agregadora; evitar leer `users/{caregiver}` directo.
  - `deviceLinks`: lectura permitida si `auth.uid` pertenece a `deviceId` (activo); escrituras solo por APIs.
  - `devices`: lectura si ligado; escritura de `desiredConfig` solo por cuidador/API.
  - `connectionCodes`: lectura/creación solo por paciente dueño; consumo/invalidación vía API.
  - Endurecer colecciones hoy “solo autenticado” (`medications`, `intakeRecords`, `deviceLinks`, `medicationEvents`, `devices`) para restringir por propietario.
- RTDB:
  - Validar lectura/escritura de `devices/*` por vínculo activo (`users/{uid}/devices/{deviceId}`) y `ownerUserId`.
  - Mantener validaciones de tipos (comandos) y requeridos en `dispenseRequests`.

## Índices y rendimiento
- Revisar y completar índices compuestos conforme a consultas reales (`medications` por `patientId + createdAt desc`, `intakeRecords` por `patientId + scheduledTime`, `medicationEvents` por `patientId/caregiverId + timestamp`, `tasks` por `caregiverId + dueDate`).
- Paginar y limitar (`limit`, `orderBy`) en hooks y servicios; evitar `onSnapshot` sobre colecciones grandes.
- Caching con SWR en lecturas no críticas; invalidación por eventos.

## APIs en Cloud Functions (nuevo/estandarización)
- `linkDeviceToUser(uid, deviceId)` y `unlinkDeviceFromUser(...)` (Callable): gestionan `deviceLinks`, `ownerUserId` y espejos Firestore/RTDB.
- `updateDeviceConfig(deviceId, patch)` (Callable): valida rol y actualiza `desiredConfig` → espejo RTDB.
- `dismissTopo(deviceId)` (Callable): consolida cierre de alarma, actualiza `intakeRecords` y estado.
- `updateInventory(patientId, medicationId, delta)` (Callable): ajusta `currentQuantity` y genera `criticalEvents` si corresponde.
- `getLinkedCaregivers(patientId)` (Callable): devuelve datos proyectados de cuidadores vinculados (evita lecturas directas de `users/{caregiver}`).
- `createConnectionCode(patientId)` / `consumeConnectionCode(code, caregiverId)` (Callable): ciclo completo de conexión.
- `getPatientIntakeRecords(patientId)` y `getPatientAdherence(patientId)` (mantener/mejorar): paginación y filtros.

## Notificaciones
- Migrar a FCM estable con dev build (evitar limitaciones de Expo Go); registrar tokens en `RTDB users/{uid}/fcmTokens`.
- Tópicos por `patientId`/`caregiverId` y envío desde Functions.
- Documentar reintentos y limpieza de tokens inválidos.

## Observabilidad
- Logging estructurado en Functions con etiquetas (`deviceId`, `userId`, `operation`).
- Métricas de tasa y latencia por operación.
- Auditoría en `commandAuditLogs`/`auditLogs`.

## Documentación (entregables)
- Por cada función/servicio:
  - Propósito, entradas, salidas, precondiciones, permisos, errores.
  - Ejemplos de uso y respuestas.
- Árbol de documentación:
  - `/docs/backend/collections.md` (esquemas y reglas).
  - `/docs/backend/apis/*.md` (cada Callable/HTTPS).
  - `/docs/backend/rtbd.md` (rutas y contratos de comandos/estado).
  - `/docs/backend/index.md` (arquitectura y flujos principales).

## Mapeo de funciones existentes
- Inicialización Firebase: `src/services/firebase/index.ts`.
- Enrutado post-auth: `src/services/routing.ts`.
- Onboarding: `src/services/onboarding.ts`.
- Vínculos dispositivo: `src/services/deviceProvisioning.ts`, `functions/src/index.ts` (triggers de link/unlink).
- Topo alarm: `src/hooks/useTopoAlarm.ts`, `functions/src/index.ts` (inicio/fin topo, intake).
- Inventario: `src/services/inventoryService.ts`, `src/services/lowQuantityNotification.ts`.
- Tareas: `src/services/firebase/tasks.ts`, `src/store/slices/tasksSlice.ts`.
- Eventos de medicación: `src/services/medicationEventService.ts`, Functions (rate limit e ingestión).
- Códigos de conexión: `src/services/connectionCode.ts`, Functions (propuesto API).
- Notificaciones push: `src/services/notifications/push.ts`, Functions (críticas y avisos).

## Resolución del error actual
- Error: `DeviceSettings` permiso-denegado al leer cuidadores y configuración.
- Acciones de diseño:
  - Introducir `getLinkedCaregivers(patientId)` (Callable) con proyección segura.
  - Reglas Firestore: permitir lectura de `deviceLinks` para paciente ligado; denegar `users/{caregiver}` directo.
  - RTDB: verificar vínculo activo para lectura de `devices/{deviceId}/state`.

## Pruebas
- Tests de reglas Firestore y RTDB para escenarios de paciente/cuidor.
- Unit/integration en Functions (Callable + triggers).
- E2E: vinculación, topo start/end, inventario bajo, tareas, conexión.

## Migración y despliegue
- Fase 1: nuevas APIs y reglas en emuladores; ajustar frontend.
- Fase 2: índices y performance; activar FCM estable (dev build).
- Fase 3: rollout progresivo con toggles; auditoría y monitoreo.

¿Confirmas este plan para proceder con la refactorización y la documentación completa? 