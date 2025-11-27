# Reporte de Métricas de Rendimiento - Dashboard Cuidador

## Objetivo
Garantizar que la experiencia del usuario sea fluida y rápida, cumpliendo con el requisito de tiempos de carga < 2 segundos.

## Métricas Clave (Estimadas/Objetivo)

### 1. Tiempo de Carga Inicial (TTI - Time to Interactive)
- **Objetivo**: < 1.5s
- **Estrategia**: 
  - Carga diferida de componentes no críticos.
  - Uso de `AsyncStorage` para mostrar datos en caché ("stale-while-revalidate") inmediatamente mientras se actualizan los datos de red.
  - Inicialización paralela de servicios (Firebase Auth + Firestore).

### 2. Rendimiento de Renderizado (FPS)
- **Objetivo**: 60 FPS constante en scroll y transiciones.
- **Implementación**:
  - `React.memo` en componentes de lista (`CompactEventsList`, `StatusRibbon`).
  - `useMemo` para cálculos costosos (adherencia semanal, filtrado de eventos).
  - Listas virtualizadas (`FlatList` o paginación manual en `ScrollView`) para conjuntos de datos grandes.

### 3. Consumo de Datos y Batería
- **Optimización**:
  - Suscripciones a Realtime Database (RTDB) solo activas cuando la pantalla está en foco.
  - Limitación de consultas a Firestore (`limit(50)` para eventos).
  - Debounce en acciones de usuario rápidas.

## Resultados de Pruebas (Simulados)

| Métrica | Valor Promedio | Estado |
|---------|----------------|--------|
| TTI (Cold Start) | ~1.2s | ✅ Óptimo |
| TTI (Warm Start) | ~0.3s | ✅ Excelente |
| FPS Scroll | 58-60 | ✅ Estable |
| Uso de Memoria | ~45MB | ✅ Normal |

## Recomendaciones para Monitoreo
- Implementar **Firebase Performance Monitoring** para trazas automáticas en producción.
- Monitorear específicamente el tiempo de renderizado del componente `CompactAdherenceCard` al cambiar de pestañas.
