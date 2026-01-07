# Rediseño del Dashboard del Cuidador

## Visión General
Este documento detalla la implementación técnica y las decisiones de diseño para el nuevo dashboard del cuidador. El objetivo principal fue crear una interfaz compacta, accesible y de alto rendimiento que permita a los cuidadores monitorear múltiples pacientes de manera eficiente.

## Arquitectura de Componentes

### 1. StatusRibbon (Cinta de Estado)
- **Propósito**: Proporcionar información crítica (estado del dispositivo, adherencia) siempre visible.
- **Características**:
  - Selección de paciente integrada.
  - Indicadores de estado del dispositivo en tiempo real (Batería, Conectividad).
  - Porcentaje de adherencia global.
- **Ubicación**: `src/components/caregiver/dashboard/StatusRibbon.tsx`

### 2. DashboardTabs (Pestañas de Navegación)
- **Propósito**: Organizar la información en vistas lógicas para reducir la carga cognitiva.
- **Vistas**:
  - **Hoy**: Enfoque inmediato (tomas pendientes, actividad reciente).
  - **7 Días**: Análisis de tendencias y adherencia histórica.
  - **Dispositivo**: Gestión técnica y estado detallado del hardware.
- **Ubicación**: `src/components/caregiver/dashboard/DashboardTabs.tsx`

### 3. CompactAdherenceCard (Tarjeta de Adherencia Compacta)
- **Propósito**: Visualizar la adherencia del paciente de forma gráfica y numérica.
- **Características**:
  - Gráfico de barras semanal con códigos de color semánticos.
  - Resumen numérico del día (Tomadas, Olvidadas, Saltadas).
  - Accesibilidad optimizada con etiquetas claras.
- **Ubicación**: `src/components/caregiver/dashboard/CompactAdherenceCard.tsx`

### 4. CollapsibleSection (Sección Colapsable)
- **Propósito**: Permitir al usuario gestionar el espacio en pantalla y ocultar información no crítica.
- **Características**:
  - Animaciones fluidas al expandir/colapsar.
  - Persistencia del estado (opcional).
  - Encabezados claros con iconos.
- **Ubicación**: `src/components/caregiver/dashboard/CollapsibleSection.tsx`

## Gestión de Estado y Datos

### Hooks Personalizados
- **`useAdherence`**: Centraliza la lógica de cálculo de adherencia. Soporta tanto datos de Redux como datos externos (para flexibilidad). Implementa memoización agresiva para evitar recálculos costosos.
- **`useDeviceState`**: Gestiona la suscripción a Firebase Realtime Database para obtener el estado del dispositivo con actualizaciones en tiempo real.
- **`useCollectionSWR`**: Implementa el patrón "Stale-While-Revalidate" para datos de Firestore (medicamentos, eventos), garantizando tiempos de carga < 2s mediante caché local.

### Integración con Firebase
- **Firestore**: Almacenamiento persistente de medicamentos, eventos e historial.
- **Realtime Database**: Estado efímero del dispositivo (batería, conectividad).

## Accesibilidad (WCAG 2.1 AA)
- **Colores**: Se utilizan tokens de color con contraste suficiente (`colors.primary[600]`, `colors.gray[900]`).
- **Roles**: Uso correcto de `accessibilityRole` ("button", "header", "alert").
- **Etiquetas**: `accessibilityLabel` descriptivos para elementos interactivos y gráficos.
- **Escalado**: Soporte para fuentes dinámicas del sistema.

## Rendimiento
- **Carga Inicial**: Priorización de datos en caché (`AsyncStorage`) mientras se actualiza en segundo plano.
- **Renderizado**: Uso de `React.memo` y `useMemo` para evitar re-renderizados innecesarios en listas y gráficos.
- **Listas**: Paginación y limitación de items (ej. últimos 5 eventos en vista "Hoy").

## Pruebas de Usabilidad (Plan)

### Objetivo
Validar que la nueva interfaz compacta sea intuitiva para cuidadores de diferentes niveles técnicos.

### Metodología
- **Participantes**: 5 cuidadores reales (3 familiares, 2 profesionales).
- **Tareas**:
  1. Identificar rápidamente si el dispositivo está conectado.
  2. Verificar si el paciente tomó su medicación de la mañana.
  3. Encontrar el historial de eventos de la semana pasada.
  4. Cambiar entre pacientes (si aplica).

### Criterios de Éxito
- Tasa de éxito en tareas > 90%.
- Tiempo promedio para verificar estado < 5 segundos.
- Puntuación SUS (System Usability Scale) > 80.

## Próximos Pasos
1. Ampliar la cobertura de pruebas E2E.
2. Implementar notificaciones push interactivas desde el dashboard.
3. Añadir modo oscuro completo.
