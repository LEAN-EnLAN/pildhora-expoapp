import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, TextInput, Modal, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { getTasksQuery, addTask, updateTask, deleteTask } from '../../src/services/firebase/tasks';
import { Task } from '../../src/types';
import { Button } from '../../src/components/ui';

export default function TasksScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tasksQuery, setTasksQuery] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    if (user) {
      getTasksQuery(user.id).then(setTasksQuery);
    }
  }, [user]);

  const { data: tasks = [], mutate } = useCollectionSWR<Task>(tasksQuery);

  const toggleCompletion = async (task: Task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
      mutate();
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "No se pudo actualizar la tarea.");
    }
  };

  const handleAddTask = async () => {
    if (newTaskText.trim() && user) {
      try {
        await addTask({
          title: newTaskText,
          description: '',
          completed: false,
          caregiverId: user.id,
          patientId: '',
          dueDate: new Date(),
        });
        mutate();
        setNewTaskText('');
        setModalVisible(false);
      } catch (error) {
        console.error("Error adding task:", error);
        Alert.alert("Error", "No se pudo agregar la tarea.");
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tareas</Text>
        <Button
          variant="primary"
          size="sm"
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </Button>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleCompletion(item)} style={styles.taskInfo}>
              <Ionicons name={item.completed ? 'checkbox' : 'square-outline'} size={24} color={item.completed ? 'green' : 'gray'} />
              <Text style={[styles.taskTitle, item.completed && styles.completedTask]}>{item.title}</Text>
            </TouchableOpacity>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => handleDeleteTask(item.id)}
            >
              <Ionicons name="trash-outline" size={22} color="red" />
            </Button>
          </View>
        )}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Nueva Tarea</Text>
            <TextInput
              placeholder="Descripción de la tarea"
              value={newTaskText}
              onChangeText={setNewTaskText}
              style={styles.input}
            />
            <Button
              variant="primary"
              size="md"
              onPress={handleAddTask}
              style={styles.button}
            >
              Agregar
            </Button>
            <Button
              variant="secondary"
              size="md"
              onPress={() => setModalVisible(false)}
              style={styles.button}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTitle: {
    marginLeft: 16,
    flex: 1,
    color: '#000000',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 8,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});
