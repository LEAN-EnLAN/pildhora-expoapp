## Objetivos Ajustados

* Pasar a un flujo completamente orientado al dispositivo con el ESP8266, pero con la App actuando como “gatekeeper” consciente del estado.

* Mantener autenticación/propiedad del dispositivo en Firestore; colocar la lógica de horarios y motor en el firmware.

* Usar RTDB como fuente de verdad para estado, solicitudes transaccionales y acks; minimizar ruido de eventos.

* Deshabilitar la toma manual del paciente; el historial se crea desde acks del dispositivo.

* Habilitar vistas de cuidador en tiempo real con CRUD de medicación y configuración.

## Críticas Incorporadas (Decisiones)

1. App Gatekeeper

* La App lee `devices/{deviceId}/state` antes de enviar cualquier solicitud.

* Solo crea `dispenseRequests/{requestId}` si `current_status='idle'` y `time_synced=true`.

* Si `jammed/door_open/error/offline`, no envía solicitud y muestra error contextual.

1. Pre‑cálculo de Configuración

* La traducción “medicamento/dosis” → “acción primitiva” vive en App/Cloud Functions.

* Firestore `medications/*` contiene metadatos (ej. `motor.turns`, `duration`, `speed`).

* La App escribe `desiredConfig.schedule` con acciones finales (ej. `{ time, dose: turns }`) que Functions normalizan y espejan a RTDB `config`.

1. Provisioning por Captive Portal

* Primer arranque: AP `Pillbox_Setup_<ID>` y portal en `http://192.168.4.1`.

* La App captura SSID/Pass del hogar y credenciales de Firebase del dispositivo, las envía y el ESP las persiste (EEPROM/NVS).

* Re‑provisión segura con botón físico/long‑press.

1. Minimizar Ruido en RTDB

* El firmware reporta solo transiciones: `booting`, `idle`, `dispensing`, `jammed`, `door_open`, `error`, `offline`.

* La App anima “Dispensando…” localmente; no requiere granularidad de motor.

## Contratos de Datos

### Firestore

* `devices/{deviceId}`: `{ owner, name, desiredConfig, lastKnownState, latestDispense, linkedUsers }`

* `deviceLinks/{linkId}`: `{ userId, deviceId, role, status, linkedAt }`

* `medications/{medId}`: `{ name, doseUnit, motor: { turns, duration, speed }, ... }`

* `intakeRecords/{recordId}`: `{ deviceId, patientId, medId, scheduledTime, dispensedTime, status, ackReason, createdBy }`

* `users/{uid}`: perfil + vínculos vía `deviceLinks`

### RTDB

* `devices/{deviceId}`

  * `status`: "online" | "offline"

  * `state`: `{ is_online, battery_level, current_status, time_synced }`

  * `config`: `{ schedule: [{ time:'08:00', dose, medId }], timezone, motor:{ speed, duration }, safety:{ maxRetries, jamTimeout, lockoutMs } }`

  * `dispenseRequests/{requestId}`: `{ triggerId, requestedBy, requestedAt, dose, medId, scheduledTime? }`

  * `lastAck`: `{ eventId, at, ok, reason? }`

  * `dispenseEvents/{eventId}`: `{ scheduledTime, requestedBy, requestedAt, dispensedAt, ok, reason, medId, dose }`

  * `ownerUserId`: UID

* `users/{uid}/devices/{deviceId}`: `true`

## Reglas de Seguridad

* Firestore: propietario/cuidadores autorizados pueden escribir `desiredConfig` y leer `intakeRecords` del paciente; auditoría activa.

* RTDB: subtree `devices/{deviceId}` accesible a dueño/cuidadores y al UID del dispositivo. Solo el dispositivo borra `dispenseRequests` que consume.

* Dispositivo: credenciales por dispositivo; rotación controlada; la App nunca guarda secretos.

## Firmware ESP8266

* Autenticación: Firebase Auth por dispositivo (`device-<id>@pillbox.local`).

* NTP/time sync: en `setup()` publicar `state={ current_status:'booting', time_synced:false }`; tras NTP OK, `time_synced:true`. Todas las rutinas de horario comienzan con `if (!time_synced) return`.

* Streaming RTDB: suscripción a `devices/{deviceId}`; consumir `dispenseRequests` (child‑added) de manera FIFO.

* Scheduling: leer `config.schedule` y ejecutar a la hora local; usar `lockoutMs` y último evento para evitar duplicados.

* Motor y seguridad: `dispenseDose(dose, motor)` con reintentos, detección de atasco y sensor de puerta.

* Acks/eventos: escribir `dispenseEvents/{eventId}` y `lastAck`; borrar el `dispenseRequests/{requestId}` procesado.

* Estado: reportes periódicos de `status/state` (batería, error).

* Buffer persistente: LittleFS/SPIFFS `event_queue.json` para eventos offline; sincronizar en reconexión y tras reinicio.

## Cloud Functions

* Mirror: Firestore `desiredConfig` → RTDB `config` (normalización/validación y timezone).

* Estado: RTDB `state` → Firestore `lastKnownState`.

* Historial: RTDB `dispenseEvents` → Firestore `intakeRecords` idempotentes.

* Vinculación: `deviceLinks` → RTDB `users/{uid}/devices/{deviceId}=true` y `ownerUserId`.

* Notificaciones: nuevos `intakeRecords` o fallos (`ok=false`) → push al cuidador.

* Salvaguardas: alertas si `time_synced=false` persistente, `jammed` o `offline` prolongado.

## App (Paciente)

* Vincular dispositivo y ver estado (incluye `time_synced`).

* Deshabilitar “Tomar Medicación”; historial desde `dispenseEvents`.

* UI tiempo real: listeners a `state`, `lastAck` y eventos recientes.

* Errores claros: `jammed`, `door_open`, `offline` y `time_synced=false`.

## App (Cuidador)

* Dashboard en vivo: estado, batería, próximo horario, `lastAck`, historia.

* CRUD de medicación/horarios: edición en Firestore; Functions reflejan a RTDB `config`.

* Solicitar dosis: crear `dispenseRequests/{requestId}` solo si App valida `idle` y `time_synced=true`.

* Auditoría: ver `intakeRecords` y filtros.

* Permisos por rol.

## Arquitectura de Horarios

* Primario: en el dispositivo usando `config.schedule` y `timezone` con gating `time_synced`.

* Secundario (opcional): Functions generan `dispenseRequests` si detectan retrasos/dispositivo online.

* De‑duplicación: `eventId={deviceId}-{ISO8601}` + `lockoutMs`; idempotencia en Functions.

## Máquina de Estados

* Estados: `booting`, `idle`, `dispensing`, `jammed`, `door_open`, `error`, `offline`.

* Transiciones: trigger→`dispensing`→`idle` éxito; `jammed` con reintentos; `door_open` bloquea motor.

## Migración (Archivos a tocar)

* Sustituir booleano de RTDB por cola transaccional:

  * `app/patient/link-device.tsx:204–213,448–449` → crear `dispenseRequests/{requestId}` en vez de `dispense=true`.

  * `src/store/slices/deviceSlice.ts:36–45,67–73` → listeners de `state` y nuevos listeners a `dispenseEvents/` y `lastAck`.

  * `functions/src/index.ts:271–337` → asegurar espejo `desiredConfig→config` y agregar trigger `dispenseEvents→intakeRecords`.

  * Alinear vínculo RTDB: `users/{uid}/devices/{deviceId}=true` según `functions/src/index.ts:188–265,343–384`.

  * Deshabilitar toma manual en `app/patient/home.tsx:215` (dejar solo lectura del historial).

## Provisioning (Flujo de App)

* Pantalla “Añadir Nuevo Dispositivo”: guía al usuario a conectarse a `Pillbox_Setup_<ID>`.

* Detección WiFi: con librería RN (ej. `react-native-wifi-reborn`), abrir `http://192.168.4.1`.

* Formulario: enviar `{ wifiSsid, wifiPass, deviceEmail, devicePassword, deviceId, timezone }`.

* Confirmación: App espera `state.time_synced` en RTDB y muestra “Listo”.

## Pruebas

* Emuladores Firebase para Firestore/RTDB/Functions.

* Banco de pruebas firmware: NTP caída/recuperación, AP/captive portal, cola y LittleFS, jam/tapa.

* Integración App: validación gatekeeper y CRUD cuidador.

* E2E: vincular→programar→dispensar automático→historial→notificaciones.

## Hitos

1. Esquema RTDB y reglas + Functions (espejo/validación y `dispenseEvents→intakeRecords`).
2. Firmware: auth, AP/captive portal, NTP/time\_synced, cola transaccional, motor/acks, LittleFS.
3. App: gatekeeper, migración a `dispenseRequests`, UI tiempo real y desactivar toma manual.
4. CRUD cuidador y normalización de config.
5. Pruebas E2E y staging.
6. Piloto hardware y producción.

## Criterios de Aceptación

* `state` visible en ≤5s; `time_synced` correcto.

* Sin duplicados de eventos; `intakeRecords` completos y consistentes.

* Reglas de seguridad estrictas; solo actores autorizados pueden escribir.

* Provisioning reproducible y simple para el usuario.

## Siguientes Pasos

* Validar este plan y contratos de datos.

* Tras aprobación, ejecutar Hito 1 (esquema RTDB, reglas y Functions de espejo) y presentar artefactos para revisión.

