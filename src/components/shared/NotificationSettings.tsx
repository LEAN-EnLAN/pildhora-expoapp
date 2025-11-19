import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

interface NotificationSettingsProps {
  enabled: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  hierarchy: string[];
  customModalities: string[];
  onToggleEnabled: (enabled: boolean) => void;
  onUpdateHierarchy: (hierarchy: string[]) => void;
  onAddModality: (modality: string) => void;
  onRemoveModality: (modality: string) => void;
  onRequestPermission?: () => Promise<void>;
  style?: any;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = React.memo(({
  enabled,
  permissionStatus,
  hierarchy,
  customModalities,
  onToggleEnabled,
  onUpdateHierarchy,
  onAddModality,
  onRemoveModality,
  onRequestPermission,
  style,
}) => {
  const [newModality, setNewModality] = useState('');
  const [isAddingModality, setIsAddingModality] = useState(false);

  const handleToggle = useCallback(async (value: boolean) => {
    if (value && permissionStatus !== 'granted') {
      if (onRequestPermission) {
        await onRequestPermission();
      } else {
        Alert.alert(
          'Permiso requerido',
          'Por favor, habilita las notificaciones en la configuración del sistema.',
          [{ text: 'OK' }]
        );
      }
    } else {
      onToggleEnabled(value);
    }
  }, [permissionStatus, onRequestPermission, onToggleEnabled]);

  const handleAddModality = useCallback(() => {
    const trimmed = newModality.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Por favor, ingresa un nombre para la modalidad.');
      return;
    }
    if (hierarchy.includes(trimmed) || customModalities.includes(trimmed)) {
      Alert.alert('Error', 'Esta modalidad ya existe.');
      return;
    }
    onAddModality(trimmed);
    setNewModality('');
    setIsAddingModality(false);
  }, [newModality, hierarchy, customModalities, onAddModality]);

  const handleRemoveModality = useCallback((modality: string) => {
    Alert.alert(
      'Eliminar modalidad',
      `¿Estás seguro de que deseas eliminar "${modality}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onRemoveModality(modality),
        },
      ]
    );
  }, [onRemoveModality]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newHierarchy = [...hierarchy];
    [newHierarchy[index - 1], newHierarchy[index]] = [
      newHierarchy[index],
      newHierarchy[index - 1],
    ];
    onUpdateHierarchy(newHierarchy);
  }, [hierarchy, onUpdateHierarchy]);

  const handleMoveDown = useCallback((index: number) => {
    if (index === hierarchy.length - 1) return;
    const newHierarchy = [...hierarchy];
    [newHierarchy[index], newHierarchy[index + 1]] = [
      newHierarchy[index + 1],
      newHierarchy[index],
    ];
    onUpdateHierarchy(newHierarchy);
  }, [hierarchy, onUpdateHierarchy]);

  const permissionStatusText = useMemo(() => {
    switch (permissionStatus) {
      case 'granted':
        return 'Concedido';
      case 'denied':
        return 'Denegado';
      case 'undetermined':
        return 'No solicitado';
      default:
        return 'Desconocido';
    }
  }, [permissionStatus]);

  const permissionStatusColor = useMemo<string>(() => {
    switch (permissionStatus) {
      case 'granted':
        return colors.success[500];
      case 'denied':
        return colors.error[500];
      case 'undetermined':
        return colors.warning[500];
      default:
        return colors.gray[400];
    }
  }, [permissionStatus]);

  // Preset configurations
  const presets = useMemo(() => [
    {
      name: 'Básico',
      hierarchy: ['urgent', 'medication', 'general'],
    },
    {
      name: 'Solo urgente',
      hierarchy: ['urgent'],
    },
    {
      name: 'Completo',
      hierarchy: ['urgent', 'medication', 'reminder', 'general'],
    },
  ], []);

  const handleApplyPreset = useCallback((preset: { name: string; hierarchy: string[] }) => {
    Alert.alert(
      'Aplicar configuración',
      `¿Deseas aplicar la configuración "${preset.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: () => onUpdateHierarchy(preset.hierarchy),
        },
      ]
    );
  }, [onUpdateHierarchy]);

  return (
    <Card variant="elevated" padding="lg" style={style}>
      <Text style={styles.title}>Notificaciones</Text>

      {/* Enable/Disable Toggle */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Habilitar notificaciones</Text>
            <View style={styles.statusContainer}>
              <View
                style={[styles.statusIndicator, { backgroundColor: permissionStatusColor }]}
              />
              <Text style={styles.statusText}>Estado: {permissionStatusText}</Text>
            </View>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
            thumbColor={colors.surface}
            accessibilityLabel="Enable notifications"
            accessibilityHint={`Notifications are currently ${enabled ? 'enabled' : 'disabled'}`}
            accessibilityRole="switch"
            accessible={true}
          />
        </View>
      </View>

      {/* Preset Configurations */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Configuraciones rápidas</Text>
        <View style={styles.presetContainer}>
          {presets.map((preset) => (
            <Button
              key={preset.name}
              onPress={() => handleApplyPreset(preset)}
              variant="outline"
              size="sm"
              style={styles.presetButton}
              accessibilityLabel={`Apply ${preset.name} preset`}
              accessibilityHint={`Sets notification hierarchy to ${preset.hierarchy.join(', ')}`}
            >
              {preset.name}
            </Button>
          ))}
        </View>
      </View>

      {/* Hierarchy Display */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Prioridad de notificaciones</Text>
        <Text style={styles.sectionDescription}>
          Las modalidades se procesan en orden de arriba a abajo
        </Text>
        <View style={styles.hierarchyList}>
          {hierarchy.map((modality, index) => (
            <View 
              key={modality} 
              style={styles.hierarchyItem}
              accessible={true}
              accessibilityLabel={`Priority ${index + 1}: ${modality}`}
            >
              <View style={styles.hierarchyItemContent}>
                <Text style={styles.hierarchyIndex}>{index + 1}</Text>
                <Chip 
                  label={modality} 
                  variant="filled" 
                  color="primary"
                  accessibilityLabel={`${modality} notification modality`}
                />
              </View>
              <View style={styles.hierarchyActions}>
                <TouchableOpacity
                  onPress={() => handleMoveUp(index)}
                  disabled={index === 0}
                  style={[styles.hierarchyButton, index === 0 && styles.hierarchyButtonDisabled]}
                  accessibilityLabel={`Move ${modality} up in priority`}
                  accessibilityHint={`Increases priority of ${modality}`}
                  accessibilityRole="button"
                  accessible={true}
                >
                  <Text style={styles.hierarchyButtonText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleMoveDown(index)}
                  disabled={index === hierarchy.length - 1}
                  style={[
                    styles.hierarchyButton,
                    index === hierarchy.length - 1 && styles.hierarchyButtonDisabled,
                  ]}
                  accessibilityLabel={`Move ${modality} down in priority`}
                  accessibilityHint={`Decreases priority of ${modality}`}
                  accessibilityRole="button"
                  accessible={true}
                >
                  <Text style={styles.hierarchyButtonText}>↓</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Custom Modalities */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Modalidades personalizadas</Text>
        <View style={styles.modalitiesContainer}>
          {customModalities.map((modality) => (
            <Chip
              key={modality}
              label={modality}
              variant="outlined"
              color="secondary"
              onRemove={() => handleRemoveModality(modality)}
              accessibilityLabel={`Custom modality: ${modality}`}
              accessibilityHint="Double tap to remove this modality"
            />
          ))}
        </View>

        {isAddingModality ? (
          <View style={styles.addModalityForm}>
            <Input
              value={newModality}
              onChangeText={setNewModality}
              placeholder="Nombre de la modalidad"
              style={styles.modalityInput}
              autoFocus
            />
            <View style={styles.addModalityActions}>
              <Button
                onPress={() => {
                  setIsAddingModality(false);
                  setNewModality('');
                }}
                variant="outline"
                size="sm"
                style={styles.addModalityButton}
              >
                Cancelar
              </Button>
              <Button
                onPress={handleAddModality}
                variant="primary"
                size="sm"
                style={styles.addModalityButton}
              >
                Agregar
              </Button>
            </View>
          </View>
        ) : (
          <Button
            onPress={() => setIsAddingModality(true)}
            variant="ghost"
            size="sm"
            style={styles.addButton}
          >
            + Agregar modalidad
          </Button>
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetButton: {
    flex: 0,
  },
  hierarchyList: {
    gap: spacing.md,
  },
  hierarchyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  hierarchyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  hierarchyIndex: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[500],
    width: 24,
    textAlign: 'center',
  },
  hierarchyActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  hierarchyButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    minWidth: 44,
    minHeight: 44,
  },
  hierarchyButtonDisabled: {
    opacity: 0.3,
  },
  hierarchyButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[700],
  },
  modalitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addModalityForm: {
    gap: spacing.md,
  },
  modalityInput: {
    marginBottom: 0,
  },
  addModalityActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addModalityButton: {
    flex: 1,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
});
