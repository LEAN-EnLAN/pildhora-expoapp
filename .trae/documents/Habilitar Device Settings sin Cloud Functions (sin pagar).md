## Objetivo
- Eliminar dependencias de Cloud Functions en Device Settings y operar con Firestore/RTDB en Spark, manteniendo UX y tiempos reales.

## Enfoque (React Native + mejores prácticas)
- Servicios orientados a datos (Firestore/RTDB) + hooks de tiempo real donde aporte.
- Validación estricta de IDs y payloads; reintentos controlados.
- Sin prompts de permisos adicionales: reglas permiten al paciente y cuidadores activos las operaciones necesarias.

## Cambios por archivo
- `app/patient/device-settings.tsx`
  - Quitar `httpsCallable` y usar servicios directos:
    - Cuidadores: `listLinkedCaregiversByDevice(deviceId)` (Firestore `deviceLinks`).
    - Config: `getDeviceConfigAggregate(deviceId)` (RTDB `config/state` + Firestore `desiredConfig`).
    - Acciones/comandos: versiones RTDB directas.
- `src/services/deviceConfig.ts`
  - Nuevas funciones:
    - `updateDeviceConfigRTDB(deviceId, desired)` y `updateDeviceConfigFirestore(deviceId, desired)`.
    - `getDeviceDesiredConfigFirestore`, `getDeviceStateRTDB`, `getDeviceConfigAggregate`.
- `src/services/deviceCommands.ts`
  - `sendDeviceCommandDirect(deviceId, command)`; reutilizar `triggerTopo/buzzer/led` sobre RTDB.
- `src/services/deviceActions.ts`
  - `requestDeviceActionDirect(deviceId, actionType, requestedBy)` creando `actions/{actionId}` en RTDB.
- `src/services/deviceLinking.ts`
  - `linkDeviceToUser` sin Function: Firestore `deviceLinks` + Firestore `devices.linkedUsers` + RTDB `users/{uid}/devices/{deviceId}`.
  - Mantener `unlink` local simétrico.
- `src/services/autonomousMode.ts`
  - Usar solo Firestore (fallback existente).

## Datos y rutas
- Firestore: `users/{uid}`, `devices/{deviceId}`, `deviceLinks/{deviceId}_{uid}`, `connectionCodes/{code}`.
- RTDB dispositivos: `devices/{deviceId}/state|commands|actions|config`.

## Reglas (resumen operativo)
- Firestore: propietario y cuidadores activos leen; propietario actualiza `desiredConfig/linkedUsers`; paciente maneja `connectionCodes` y `autonomousMode`.
- RTDB: owner/cuidadores escriben `commands/actions`; lectura de `state/config` para vinculados.

## Flags
- `EXPO_PUBLIC_DISABLE_FUNCTIONS=true` (gating en servicios); mantener `EXPO_PUBLIC_FIREBASE_DEVICE_DATABASE_URL=https://devices-m1947.firebaseio.com`.
- Emuladores opcionales: `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`.

## Pruebas
- Unitarias por servicio (validaciones, lecturas/escrituras, reintentos).
- Reglas con `@firebase/rules-unit-testing` (Firestore/RTDB).
- Integración en Device Settings: cuidadores, configuración, estado, comandos, modo autónomo.

## Resultado
- Device Settings funcionando 100% con Firestore/RTDB gratis, sin `functions/unauthenticated`, y alineado con tu ecosistema TOPO. ✅