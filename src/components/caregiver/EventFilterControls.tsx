import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';
import { MedicationEventType } from '../../types';

export interface EventFilters {
  patientId?: string;
  eventType?: MedicationEventType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

interface EventFilterControlsProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  patients: Array<{ id: string; name: string }>;
}

export const EventFilterControls: React.FC<EventFilterControlsProps> = ({
  filters,
  onFiltersChange,
  patients,
}) => {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  /**
   * Load saved filters from AsyncStorage on mount
   * DISABLED: This was causing infinite refresh loops because loading filters
   * on mount triggers filter changes, which regenerate cache keys with new Date
   * object references, causing the SWR hook to refetch continuously.
   * 
   * Users can manually set filters each session, which is acceptable UX.
   */
  // useEffect(() => {
  //   const loadFilters = async () => {
  //     try {
  //       const savedFilters = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
  //       if (savedFilters) {
  //         const parsed = JSON.parse(savedFilters);
  //         // Convert date strings back to Date objects
  //         if (parsed.dateRange) {
  //           parsed.dateRange = {
  //             start: new Date(parsed.dateRange.start),
  //             end: new Date(parsed.dateRange.end),
  //           };
  //         }
  //         onFiltersChange(parsed);
  //       }
  //     } catch (error) {
  //       console.error('[EventFilterControls] Error loading filters:', error);
  //     }
  //   };

  //   loadFilters();
  // }, []); // Only run on mount

  /**
   * Save filters to AsyncStorage whenever they change
   * DISABLED: Auto-save removed since auto-load was causing infinite refresh loops.
   * Filters are now session-only, which is acceptable UX.
   */
  // useEffect(() => {
  //   const saveFilters = async () => {
  //     try {
  //       await AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  //     } catch (error) {
  //       console.error('[EventFilterControls] Error saving filters:', error);
  //     }
  //   };

  //   // Only save if filters object is not empty (to avoid saving initial empty state)
  //   if (Object.keys(filters).length > 0 || filters.searchQuery !== undefined) {
  //     saveFilters();
  //   }
  // }, [filters]);

  const hasActiveFilters = !!(
    filters.patientId ||
    filters.eventType ||
    filters.dateRange ||
    filters.searchQuery
  );

  const getPatientName = (patientId?: string) => {
    if (!patientId) return 'Todos los pacientes';
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Paciente desconocido';
  };

  const getEventTypeLabel = (eventType?: MedicationEventType) => {
    if (!eventType) return 'Todos los eventos';
    switch (eventType) {
      case 'created':
        return 'Creados';
      case 'updated':
        return 'Actualizados';
      case 'deleted':
        return 'Eliminados';
      default:
        return 'Todos los eventos';
    }
  };

  const getDateRangeLabel = (dateRange?: { start: Date; end: Date }) => {
    if (!dateRange) return 'Todo el tiempo';
    const start = dateRange.start.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    const end = dateRange.end.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const handlePatientSelect = (patientId?: string) => {
    onFiltersChange({ ...filters, patientId });
    setShowPatientModal(false);
  };

  const handleEventTypeSelect = (eventType?: MedicationEventType) => {
    onFiltersChange({ ...filters, eventType });
    setShowEventTypeModal(false);
  };

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, searchQuery: text || undefined });
  };

  const handleDateRangeSelect = (preset: string) => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        onFiltersChange({ ...filters, dateRange: undefined });
        setShowDateRangeModal(false);
        return;
      default:
        return;
    }

    onFiltersChange({ ...filters, dateRange: { start, end } });
    setShowDateRangeModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por medicamento..."
          placeholderTextColor={colors.gray[400]}
          value={filters.searchQuery || ''}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Buscar medicamentos"
          accessibilityHint="Escribe el nombre del medicamento para filtrar eventos"
          accessibilityRole="search"
        />
        {filters.searchQuery && (
          <TouchableOpacity
            onPress={() => handleSearchChange('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filtersRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {/* Patient filter */}
          <TouchableOpacity
            style={[styles.filterChip, filters.patientId && styles.filterChipActive]}
            onPress={() => setShowPatientModal(true)}
            accessibilityLabel={`Filtrar por paciente: ${getPatientName(filters.patientId)}`}
            accessibilityHint="Abre el selector de pacientes para filtrar eventos"
            accessibilityRole="button"
            accessibilityState={{ selected: !!filters.patientId }}
          >
            <Ionicons
              name="person-outline"
              size={16}
              color={filters.patientId ? colors.primary[500] : colors.gray[600]}
            />
            <Text
              style={[styles.filterChipText, filters.patientId && styles.filterChipTextActive]}
            >
              {getPatientName(filters.patientId)}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={filters.patientId ? colors.primary[500] : colors.gray[600]}
            />
          </TouchableOpacity>

          {/* Event type filter */}
          <TouchableOpacity
            style={[styles.filterChip, filters.eventType && styles.filterChipActive]}
            onPress={() => setShowEventTypeModal(true)}
            accessibilityLabel={`Filtrar por tipo de evento: ${getEventTypeLabel(filters.eventType)}`}
            accessibilityHint="Abre el selector de tipos de evento para filtrar"
            accessibilityRole="button"
            accessibilityState={{ selected: !!filters.eventType }}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={filters.eventType ? colors.primary[500] : colors.gray[600]}
            />
            <Text
              style={[styles.filterChipText, filters.eventType && styles.filterChipTextActive]}
            >
              {getEventTypeLabel(filters.eventType)}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={filters.eventType ? colors.primary[500] : colors.gray[600]}
            />
          </TouchableOpacity>

          {/* Date range filter */}
          <TouchableOpacity
            style={[styles.filterChip, filters.dateRange && styles.filterChipActive]}
            onPress={() => setShowDateRangeModal(true)}
            accessibilityLabel={`Filtrar por fecha: ${getDateRangeLabel(filters.dateRange)}`}
            accessibilityHint="Abre el selector de rango de fechas para filtrar eventos"
            accessibilityRole="button"
            accessibilityState={{ selected: !!filters.dateRange }}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={filters.dateRange ? colors.primary[500] : colors.gray[600]}
            />
            <Text
              style={[styles.filterChipText, filters.dateRange && styles.filterChipTextActive]}
            >
              {getDateRangeLabel(filters.dateRange)}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={filters.dateRange ? colors.primary[500] : colors.gray[600]}
            />
          </TouchableOpacity>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={handleClearFilters}
              accessibilityLabel="Limpiar filtros"
              accessibilityHint="Elimina todos los filtros activos"
              accessibilityRole="button"
            >
              <Ionicons name="close-circle" size={16} color={colors.error[500]} />
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Patient selection modal */}
      <Modal
        visible={showPatientModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPatientModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por paciente</Text>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  !filters.patientId && styles.modalOptionActive,
                ]}
                onPress={() => handlePatientSelect(undefined)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    !filters.patientId && styles.modalOptionTextActive,
                  ]}
                >
                  Todos los pacientes
                </Text>
                {!filters.patientId && (
                  <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>
              {patients.map(patient => (
                <TouchableOpacity
                  key={patient.id}
                  style={[
                    styles.modalOption,
                    filters.patientId === patient.id && styles.modalOptionActive,
                  ]}
                  onPress={() => handlePatientSelect(patient.id)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      filters.patientId === patient.id && styles.modalOptionTextActive,
                    ]}
                  >
                    {patient.name}
                  </Text>
                  {filters.patientId === patient.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              onPress={() => setShowPatientModal(false)}
              variant="secondary"
            >
              Cerrar
            </Button>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Event type selection modal */}
      <Modal
        visible={showEventTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEventTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEventTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por tipo de evento</Text>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  !filters.eventType && styles.modalOptionActive,
                ]}
                onPress={() => handleEventTypeSelect(undefined)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    !filters.eventType && styles.modalOptionTextActive,
                  ]}
                >
                  Todos los eventos
                </Text>
                {!filters.eventType && (
                  <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  filters.eventType === 'created' && styles.modalOptionActive,
                ]}
                onPress={() => handleEventTypeSelect('created')}
              >
                <Ionicons name="add-circle" size={20} color={colors.success[500]} />
                <Text
                  style={[
                    styles.modalOptionText,
                    filters.eventType === 'created' && styles.modalOptionTextActive,
                  ]}
                >
                  Creados
                </Text>
                {filters.eventType === 'created' && (
                  <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  filters.eventType === 'updated' && styles.modalOptionActive,
                ]}
                onPress={() => handleEventTypeSelect('updated')}
              >
                <Ionicons name="create" size={20} color={colors.primary[500]} />
                <Text
                  style={[
                    styles.modalOptionText,
                    filters.eventType === 'updated' && styles.modalOptionTextActive,
                  ]}
                >
                  Actualizados
                </Text>
                {filters.eventType === 'updated' && (
                  <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  filters.eventType === 'deleted' && styles.modalOptionActive,
                ]}
                onPress={() => handleEventTypeSelect('deleted')}
              >
                <Ionicons name="trash" size={20} color={colors.error[500]} />
                <Text
                  style={[
                    styles.modalOptionText,
                    filters.eventType === 'deleted' && styles.modalOptionTextActive,
                  ]}
                >
                  Eliminados
                </Text>
                {filters.eventType === 'deleted' && (
                  <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>
            </ScrollView>
            <Button
              onPress={() => setShowEventTypeModal(false)}
              variant="secondary"
            >
              Cerrar
            </Button>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date range selection modal */}
      <Modal
        visible={showDateRangeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateRangeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateRangeModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por fecha</Text>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  !filters.dateRange && styles.modalOptionActive,
                ]}
                onPress={() => handleDateRangeSelect('all')}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    !filters.dateRange && styles.modalOptionTextActive,
                  ]}
                >
                  Todo el tiempo
                </Text>
                {!filters.dateRange && (
                  <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleDateRangeSelect('today')}
              >
                <Text style={styles.modalOptionText}>Hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleDateRangeSelect('week')}
              >
                <Text style={styles.modalOptionText}>Últimos 7 días</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleDateRangeSelect('month')}
              >
                <Text style={styles.modalOptionText}>Este mes</Text>
              </TouchableOpacity>
            </ScrollView>
            <Button
              onPress={() => setShowDateRangeModal(false)}
              variant="secondary"
            >
              Cerrar
            </Button>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    padding: 0,
    minHeight: 24,
  },
  filtersRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  filtersContent: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    minHeight: 44,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
    shadowColor: colors.primary[500],
    shadowOpacity: 0.1,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error[500],
    minHeight: 44,
    shadowColor: colors.error[500],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[500],
    fontWeight: typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    gap: spacing.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  modalList: {
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    minHeight: 56,
  },
  modalOptionActive: {
    backgroundColor: colors.primary[50],
  },
  modalOptionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  modalOptionTextActive: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
});
