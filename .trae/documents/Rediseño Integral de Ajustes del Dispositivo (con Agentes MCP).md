## Objetivos
- Reconstruir y rediseñar por completo la pantalla de Ajustes del Dispositivo con lógica sólida y UI/UX moderna.
- Restaurar y robustecer la vinculación dispositivo–usuario (paciente/cuidador), evitando errores de permisos y autenticación.
- Integrar edición de configuración, información precisa del dispositivo, cuidadores y generación/gestión de códigos.
- Garantizar navegación clara con aprovisionamiento (provisioning) y validación en tiempo real.

## Alcance Funcional
- Vincular/Desvincular dispositivo:
  - Vincular paciente a un dispositivo.
  - Revocar acceso de cuidadores y desvincular el propio dispositivo.
- Información del dispositivo:
  - ID, estado actual (RTDB/Firestore), batería, conexión, última actualización.
- Configuración editable:
  - `alarm_mode`, `led_intensity`, `led_color_rgb`, guardado con feedback.
- Cuidadores:
  - Listado (nombre, email, fecha de vínculo), revocación de acceso.
- Códigos de conexión:
  - Generar, compartir y revocar códigos activos.
- Modo Autónomo:
  - Activar/desactivar con advertencias claras.
- Navegación:
  - Botones discretos y accesibles para alternar entre Ajustes y Provisioning.

## Arquitectura Técnica
- Estado y Servicios (frontend):
  - Servicios centralizados: `deviceLinking`, `connectionCode`, `deviceConfig`, `autonomousMode`, `deviceActions`.
  - Redux: `auth` para usuario y `device`/local state para estadísticas/edición.
- Cloud Functions (backend):
  - `linkDeviceToUser(deviceId)`: crea `deviceLinks`, actualiza `devices.linkedUsers`, setea `primaryPatientId` si es paciente, refleja RTDB `/users/{uid}/devices/{deviceId}`.
  - `unlinkDeviceFromUser(deviceId, userId?)`: marca vínculo inactivo, limpia `users.deviceId` (paciente), borra asociación RTDB.
  - Triggers espejo: RTDB→Firestore (estado), Firestore→RTDB (desired config).
- Firestore/RTDB (datos):
  - `users/{uid}`: `deviceId`, perfil.
  - `devices/{deviceId}`: `linkedUsers`, `primaryPatientId`, `desiredConfig`, `lastKnownState`.
  - `deviceLinks/{deviceId}_{uid}`: `role`, `status`, `linkedAt`, `unlinkedAt`.
  - RTDB: `/users/{uid}/devices/{deviceId}`, `/devices/{deviceId}/state|config|ownerUserId`.
- Reglas de Seguridad (propuesta):
  - Bloquear cambios sensibles (`linkedUsers`, `primaryPatientId`, creación en `deviceLinks`) desde cliente.
  - Permitir `desiredConfig` desde cliente sólo si vínculo activo.
  - Lecturas condicionadas a vínculo activo.

## Diseño de UI/UX
- Layout por secciones apiladas (ScrollView) evitando desbordes:
  - Encabezado: título, botón a provisioning/settings.
  - Panel dispositivo: ID (con elipsis medio), batería, estado.
  - Controles de configuración: `DeviceConfigPanel`.
  - Acciones: dispensar, desvincular.
  - Cuidadores conectados: tarjetas con nombre/email (1 línea, elipsis).
  - Códigos de conexión: listado con acciones compartir/revocar.
  - Ayuda/explicaciones: breves y accionables.
- Accesibilidad:
  - `accessibilityRole="header"` en títulos, `LiveRegion` en mensajes, `Labels` y `Hints` en botones.
- Estilo:
  - Reusar `tokens` existentes, iconos `Ionicons`, sin nuevas librerías.

## Pruebas en Tiempo Real (MCP React Tester)
- Escenarios:
  - Navegación Ajustes ↔ Provisioning.
  - Vincular dispositivo con usuario paciente.
  - Revocar cuidador y verificar UI.
  - Editar configuración y ver reflejo en estado.
  - Generar/compartir/revocar código.
  - Activar/desactivar Modo Autónomo.
- Verificación:
  - Logs de servicios, actualización de Redux (`checkAuthState`), que no haya `permission-denied` ni `unauthenticated`.

## Plan de Trabajo por Agentes
- React Native Pro (implementación):
  - Añadir botones de navegación en headers y acciones de enlace/desvinculación usando servicios.
  - Integrar `DeviceConfigPanel` y lectura de estado del dispositivo.
  - Conectar listas de cuidadores y códigos a servicios.
  - Validar en tiempo real con MCP React Tester.
- Frontend Design Researcher (arquitectura de la pantalla):
  - Pulir microcopy, accesibilidad, prevención de offscreen.
  - Ajustar layout y jerarquía visual sin romper lógica.
- Firebase Sync Wizard (integración y reglas):
  - Revisar y alinear servicios con Cloud Functions y reglas seguras.
  - Proponer/aplicar reglas para eliminar errores de permisos/autenticación.

## Entregables
- Nueva pantalla de Ajustes del Dispositivo rediseñada.
- Servicios de vínculo y configuración alineados con backend.
- Navegación clara y accesible.
- Reglas Firebase propuestas/documentadas y validadas.

## Validación y Criterios de Aceptación
- Navegación bidireccional estable.
- Vinculación/desvinculación sin errores y reflejada en UI.
- Configuración guardada con feedback y aplicada en estado.
- Listado de cuidadores y códigos funcionales.
- Sin `permission-denied`/`unauthenticated` en logs durante acciones esperadas.

¿Confirmas que avancemos con este plan y ejecutemos los tres agentes (React Native Pro, Frontend Design Researcher y Firebase Sync Wizard) para implementar y probar en tiempo real?