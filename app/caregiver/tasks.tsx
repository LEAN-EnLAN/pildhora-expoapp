/**
 * Tasks Screen
 * 
 * Simple note-taking feature for caregivers to manage their to-dos.
 * Refactored to use design system components with proper styling.
 * 
 * Features:
 * - Create, read, update, delete tasks
 * - Mark tasks as complete/incomplete with checkbox toggle
 * - Visual styling for completed tasks (strikethrough, gray)
 * - Tasks scoped to individual caregiver account
 * - Design system Card, Button, and Input components
 * - Proper accessibility labels and touch targets
 * - Empty state when no tasks exist
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, FlatList, Alert, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { useScrollViewPadding } from '../../src/hooks/useScrollViewPadding';
import { getTasksQuery, addTask, updateTask, deleteTask } from '../../src/services/firebase/tasks';
import { Task } from '../../src/types';
import { Button, Card, Input, Modal } from '../../src/components/ui';
import { ScreenWrapper } from '../../src/components/caregiver';
import { colors, spacing, typography, borderRadius } from '../../src/theme/tokens';

export default function TasksScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Layout dimensions for proper spacing
  const { contentPaddingBottom } = useScrollViewPadding();
  
  const [tasksQuery, setTasksQuery] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskError, setNewTaskError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      getTasksQuery(user.id).then(setTasksQuery);
    }
  }, [user]);

  const { data: tasks = [], mutate } = useCollectionSWR<Task>({ 
    query: tasksQuery, 
    cacheKey: user?.id ? `tasks:${user.id}` : null 
  });

  /**
   * Toggles task completion status
   * Updates Firestore document and applies visual styling
   */
  const toggleCompletion = useCallback(async (task: Task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
      mutate();
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "No se pudo actualizar la tarea.");
    }
  }, [mutate]);

  /**
   * Handles adding a new task
   * Validates input and creates task in Firestore
   * Prevents duplicate submissions with loading state
   */
  const handleAddTask = useCallback(async () => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    // Validate input
    if (!newTaskText.trim()) {
      setNewTaskError('Por favor ingresa una descripción para la tarea');
      return;
    }

    if (!user) {
      Alert.alert("Error", "Usuario no autenticado");
      return;
    }

    setIsSubmitting(true);

    try {
      await addTask({
        title: newTaskText.trim(),
        description: '',
        completed: false,
        caregiverId: user.id,
        patientId: '',
        dueDate: new Date(),
      });
      mutate();
      setNewTaskText('');
      setNewTaskError('');
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding task:", error);
      Alert.alert("Error", "No se pudo agregar la tarea.");
    } finally {
      setIsSubmitting(false);
    }
  }, [newTaskText, user, mutate, isSubmitting]);

  /**
   * Handles deleting a task with confirmation
   */
  const handleDeleteTask = useCallback((taskId: string) => {
    Alert.alert(
      "Eliminar Tarea",
      "¿Estás seguro de que quieres eliminar esta tarea?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(taskId);
              mutate();
            } catch (error) {
              console.error("Error deleting task:", error);
              Alert.alert("Error", "No se pudo eliminar la tarea.");
            }
          },
        },
      ]
    );
  }, [mutate]);

  /**
   * Opens add task modal
   */
  const handleOpenModal = useCallback(() => {
    setNewTaskText('');
    setNewTaskError('');
    setIsSubmitting(false);
    setModalVisible(true);
  }, []);

  /**
   * Closes add task modal
   */
  const handleCloseModal = useCallback(() => {
    if (isSubmitting) {
      return; // Prevent closing while submitting
    }
    setModalVisible(false);
    setNewTaskText('');
    setNewTaskError('');
    setIsSubmitting(false);
  }, [isSubmitting]);

  /**
   * Renders individual task item
   * Memoized to prevent unnecessary re-renders
   */
  const renderTaskItem = useCallback(({ item }: { item: Task }) => (
    <Card
      variant="elevated"
      padding="md"
      style={styles.taskCard}
      accessibilityLabel={`Task: ${item.title}, ${item.completed ? 'completed' : 'not completed'}`}
    >
      <View style={styles.taskContent}>
        {/* Checkbox and task title */}
        <TouchableOpacity
          onPress={() => toggleCompletion(item)}
          style={styles.taskInfo}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed }}
          accessibilityLabel={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
          accessibilityHint={`Toggles completion status for task: ${item.title}`}
          accessible={true}
        >
          <View style={styles.checkboxContainer}>
            <Ionicons
              name={item.completed ? 'checkbox' : 'square-outline'}
              size={28}
              color={item.completed ? colors.success[500] : colors.gray[400]}
            />
          </View>
          <Text
            style={[
              styles.taskTitle,
              item.completed && styles.completedTaskTitle,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          onPress={() => handleDeleteTask(item.id)}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Delete task"
          accessibilityHint={`Deletes task: ${item.title}`}
          accessible={true}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error[500]} />
        </TouchableOpacity>
      </View>
    </Card>
  ), [toggleCompletion, handleDeleteTask]);

  /**
   * Key extractor for FlatList optimization
   * Using task ID ensures stable keys across renders
   */
  const keyExtractor = useCallback((item: Task) => item.id, []);

  /**
   * Get item layout for FlatList optimization
   * Provides exact dimensions for better scroll performance
   */
  const getItemLayout = useCallback(
    (_data: ArrayLike<Task> | null | undefined, index: number) => ({
      length: 100, // Approximate height of task card + margin
      offset: 100 * index,
      index,
    }),
    []
  );

  /**
   * Renders empty state when no tasks exist
   */
  const renderEmptyState = () => (
    <View 
      style={styles.emptyStateContainer}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel="No hay tareas. Crea tu primera tarea para comenzar a organizar tus pendientes"
    >
      <Ionicons name="checkbox-outline" size={64} color={colors.gray[300]} accessible={false} />
      <Text style={styles.emptyStateTitle}>No hay tareas</Text>
      <Text style={styles.emptyStateDescription}>
        Crea tu primera tarea para comenzar a organizar tus pendientes
      </Text>
    </View>
  );

  return (
    <ScreenWrapper>
      {/* Tasks list */}
      <FlatList
        data={tasks}
        keyExtractor={keyExtractor}
        renderItem={renderTaskItem}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Button
              variant="primary"
              size="md"
              onPress={handleOpenModal}
              fullWidth
              leftIcon={<Ionicons name="add" size={24} color={colors.surface} />}
              accessibilityLabel="Add new task"
              accessibilityHint="Opens dialog to create a new task"
            >
              Nueva Tarea
            </Button>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          tasks.length === 0 && styles.listContentEmpty,
          { paddingBottom: contentPaddingBottom },
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Lista de tareas"
        accessibilityRole="list"
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={getItemLayout}
      />

      {/* Add task modal */}
      <Modal
        visible={modalVisible}
        onClose={handleCloseModal}
        title="Nueva Tarea"
        size="md"
      >
        <ScrollView style={styles.modalContent}>
          <Input
            label="Descripción de la tarea"
            placeholder="Ej: Revisar medicamentos del paciente"
            value={newTaskText}
            onChangeText={(text) => {
              setNewTaskText(text);
              if (newTaskError) setNewTaskError('');
            }}
            error={newTaskError}
            variant="outlined"
            size="lg"
            multiline
            numberOfLines={3}
            required
            accessibilityLabel="Task description input"
            accessibilityHint="Enter a description for the new task"
          />

          <View style={styles.modalActions}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleAddTask}
              disabled={isSubmitting || !newTaskText.trim()}
              leftIcon={<Ionicons name="checkmark" size={20} color={colors.surface} />}
              accessibilityLabel="Add task"
              accessibilityHint="Creates the new task"
            >
              {isSubmitting ? 'Agregando...' : 'Agregar'}
            </Button>

            <Button
              variant="outline"
              size="md"
              fullWidth
              onPress={handleCloseModal}
              disabled={isSubmitting}
              accessibilityLabel="Cancel"
              accessibilityHint="Closes the add task dialog"
            >
              Cancelar
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCard: {
    marginBottom: spacing.md,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.md,
  },
  checkboxContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[900],
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: colors.gray[500],
    fontWeight: typography.fontWeight.normal,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  modalContent: {
    gap: spacing.lg,
  },
  modalActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
