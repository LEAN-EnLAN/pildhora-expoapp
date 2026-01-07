## Causa
- Al eliminar callables, las operaciones pasaron a Firestore/RTDB cliente y chocan con reglas actuales: `permission-denied` en `deviceLinks`, `devices` y `connectionCodes`, y RTDB `config/commands`.

## Plan por Fases
- Fase 1: Repositorios RN (capa de dominio)
  - Crear `DeviceSettingsRepository` y `FirestoreDeviceSettingsRepository` para aislar lecturas/escrituras de configuración.
  - Hook `useDeviceSettings` con caché/optimistic update.
- Fase 2: Reglas y permisos Firebase
  - Firestore: asegurar lecturas/escrituras para propietario y cuidadores vinculados en `devices`, `deviceLinks`, `connectionCodes`.
  - RTDB: endurecer `devices/{deviceId}/{commands|config}` para owner o vínculo (`users/{uid}/devices/{deviceId}`), permitir `state` de hardware.
  - Desplegar reglas e índices; probar en emuladores antes.
- Fase 3: Integración RN
  - En Device Settings, usar repositorio/hook para cargar y actualizar configuración; mover consultas de cuidadores a Firestore con filtros seguros.
  - Mantener comandos/acciones en RTDB y validar vínculo antes de escribir.
- Fase 4: Pruebas
  - Unitarias de repositorio y hook; tests de reglas con `@firebase/rules-unit-testing`; integración de pantalla.
  - Escenarios: propietario, cuidador vinculado, usuario no vinculado.

## Reglas concretas (RTDB)
- Validar owner o vínculo para `.read/.write` en `devices/$deviceId/commands` y `config` usando `ownerUserId` o `users/{uid}/devices/{deviceId}`; `state` escribible por hardware.

## Despliegue
- Emuladores → validar flujos; luego `firebase deploy --only firestore:rules,firestore:indexes,database`.

## Resultado
- Device Settings vuelve a operar en Spark: configuración, cuidadores, códigos, comandos/acciones, con permisos correctos y sin callables. ✅