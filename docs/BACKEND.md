# Documentación del Backend - Pildhora App

## Visión General

La arquitectura de backend de Pildhora App utiliza Firebase como plataforma principal, aprovechando:
- **Firestore**: Para datos estructurados y persistentes (usuarios, configuraciones, enlaces).
- **Realtime Database (RTDB)**: Para sincronización en tiempo real con dispositivos IoT (estado, comandos).
- **Cloud Functions**: Para lógica de negocio segura y operaciones privilegiadas.

## Modelo de Seguridad

Hemos migrado de un modelo de acceso directo a base de datos a un modelo basado en **Cloud Functions (Proxy Pattern)**. Esto garantiza:

1.  **Least Privilege**: Los clientes (App) no tienen permisos de escritura directa en colecciones críticas.
2.  **Validación Centralizada**: Toda modificación de datos pasa por validaciones en el servidor.
3.  **Privacidad**: Los pacientes solo pueden acceder a datos de cuidadores explícitamente vinculados.

### Reglas de Seguridad

- **Firestore**: Bloqueo total de escritura en `deviceLinks`, `connectionCodes`, `deviceConfigs`, `devices`. Lectura restringida a propietarios/vinculados.
- **RTDB**: Bloqueo total de escritura en `commands`, `config`, `ownerUserId`. Lectura permitida solo a usuarios autenticados.

## Cloud Functions

Las funciones se encuentran en `functions/src/index.ts` y se dividen en categorías:

### Gestión de Códigos de Conexión
- `generateConnectionCode`: Genera un código único de 6 dígitos para vincular un paciente.
- `validateConnectionCode`: Verifica si un código es válido sin consumirlo.
- `useConnectionCode`: Consume un código para vincular un cuidador a un paciente.
- `revokeConnectionCode`: Invalida un código existente.
- `getActiveConnectionCodes`: Lista códigos activos del usuario.

### Gestión de Dispositivos
- `linkDeviceToUser`: Vincula un dispositivo físico a un usuario (paciente o cuidador).
- `unlinkDeviceFromUser`: Desvincula un dispositivo.
- `updateDeviceConfig`: Actualiza configuración (alarmas, LED) sincronizando Firestore y RTDB.
- `getDeviceConfig`: Obtiene la configuración consolidada.
- `getLinkedCaregivers`: Obtiene lista de cuidadores vinculados al paciente (sin acceso directo a colección `users`).

### Comandos y Acciones
- `sendDeviceCommand`: Envía comandos (buzzer, led, reboot) a RTDB.
- `requestDeviceAction`: Gestiona acciones complejas como dispensación de dosis.
- `onTopoAlarmStarted`/`onTopoAlarmEnded`: Triggers de RTDB para registrar eventos de medicación.

## Flujos de Datos Críticos

### 1. Vinculación de Cuidador
1.  Paciente genera código (`generateConnectionCode`).
2.  Código se guarda en Firestore `connectionCodes`.
3.  Cuidador introduce código (`useConnectionCode`).
4.  Backend verifica y crea documento en `deviceLinks`.

### 2. Configuración de Dispositivo
1.  Usuario cambia configuración en App.
2.  App llama a `updateDeviceConfig`.
3.  Function valida permisos en `deviceLinks`.
4.  Function actualiza Firestore `deviceConfigs`.
5.  Function actualiza RTDB `devices/{id}/config` (mirroring).
6.  Dispositivo IoT lee nueva configuración de RTDB.

### 3. Comandos (e.g., Alarma)
1.  Usuario pulsa botón en App.
2.  App llama a `sendDeviceCommand`.
3.  Function valida permisos.
4.  Function escribe en RTDB `devices/{id}/commands`.
5.  Dispositivo IoT lee comando y ejecuta acción.

## Guía de Desarrollo

Para añadir nuevas funcionalidades:
1.  **No escribir directamente en DB desde el frontend.**
2.  Crear una Cloud Function `onCall`.
3.  Validar autenticación (`request.auth`).
4.  Validar propiedad/vinculación (`deviceLinks`).
5.  Ejecutar lógica y retornar resultado.
6.  Actualizar servicios en `/src/services` para llamar a la nueva función.
