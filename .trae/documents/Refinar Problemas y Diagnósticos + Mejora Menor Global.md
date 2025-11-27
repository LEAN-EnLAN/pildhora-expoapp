## Objetivos
- Unificar y mejorar la experiencia de “Problemas y Diagnósticos”.
- Aplicar mejoras menores transversales (accesibilidad, rendimiento, consistencia visual y tipado).

## Alcance
- Crear/normalizar una sección visible de Diagnósticos (ancla/route) accesible desde paciente y cuidador.
- Integrar fuentes de errores (provisionamiento, códigos de conexión, validaciones y scripts).
- Corregir tipados de paleta (errores `700/800` en `app/patient/home.tsx`).

## Diagnóstico Actual
- No existe el ancla literal `#problems_and_diagnostics`; hay contenido disperso: scripts en `scripts/diagnostics/*`, utilidades en `src/utils/*Errors.ts` y componentes de error.
- Errores TS: uso de `colors.*[700|800]` sin tipos; p.ej. `home.tsx` (líneas 134 y 229).

## Plan de Refinamiento de “Problemas y Diagnósticos”
- Crear vista “Diagnósticos” con pestañas: Dispositivos, Medicación, Conectividad, Accesibilidad.
- Normalizar el modelo de error (discriminated unions) y severidad (info/warn/error/critical).
- Mapear cada error a una acción de remediación y a clave i18n (ES/EN) con enlaces a guías.
- Integrar fuentes:
  - `deviceProvisioningErrors.ts`, `connectionCodeErrors.ts`.
  - Resultados de `scripts/diagnostics/*` (mostrar resumen: conteos y detalles).
- Añadir filtros (fecha, tipo, dispositivo, medicamento) y búsqueda.
- Diseñar componentes reutilizables: `DiagnosticCard`, `DiagnosticList`, `RemediationSteps`.

## Mejora Menor Global del App
- Accesibilidad: contrastes AA, `aria-*` en diálogos, foco visible y orden de tab.
- Estado vacío/cargas: skeletons y mensajes claros en listas y pantallas.
- Rendimiento:
  - Listas con `FlatList`/`SectionList` optimizadas (`getItemLayout`, `keyExtractor`, memo).
  - Lazy-load de pantallas y `detachInactiveScreens`/`freezeOnBlur` en navegación.
- Consistencia visual: uso de escala de espaciados, tamaños de fuente y tokens de color.
- Errores y límites: `ErrorBoundary` global y por flujo crítico.
- Telemetría no sensible: log estructurado de diagnósticos (opt-in, respetando privacidad).

## Cambios Técnicos (prioritarios)
- Tipos de paleta:
  - Opción A: ampliar `colors` para soportar `50..900` con tipos.
  - Opción B: migrar usos a los tonos existentes (p.ej. `600`), manteniendo contraste.
- Corregir `app/patient/home.tsx` para eliminar indexaciones no tipadas (`[700]`, `[800]`).
- Centralizar tokens en `src/theme/colors.ts` y exponer tipos.
- Unificar `ErrorMessage`/`Toast` para severidad y esquema de colores.
- Añadir claves i18n para todos los mensajes de diagnóstico.

## Verificación y Calidad
- Linter/TypeScript: repo “verde” (sin errores) y reglas consistentes.
- Pruebas: unitarias para mapeo de errores y integración de la vista “Diagnósticos”.
- Auditoría de accesibilidad: scripts existentes + verificación manual de contrastes.
- Revisión visual: chequeo rápido de tipografías, espaciados y estados.

## Entregables
- Nueva vista “Diagnósticos” integrada en navegación.
- Tipos de paleta corregidos y usos compatibles.
- Componentes reutilizables y documentación breve (cómo añadir nuevos errores).

## Riesgos y Consideraciones
- Ampliar la paleta requiere coordinar con estilos existentes.
- Integrar scripts de diagnósticos como fuente puede necesitar adaptar su salida.
- Mantener privacidad: no exponer datos sensibles en la UI de diagnósticos.