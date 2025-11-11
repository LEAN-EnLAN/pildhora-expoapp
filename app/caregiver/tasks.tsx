import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, TextInput, Modal, Alert, TouchableOpacity } from 'react-native';
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

  const { data: tasks = [], source, isLoading, error } = useCollectionSWR<Task>(tasksQuery);

  const toggleCompletion = async (task: Task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
      // Re-fetch tasks by updating the query
      if (user) {
        getTasksQuery(user.id).then(setTasksQuery);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "No se pudo actualizar la tarea.");
    }
  };

  const handleAddTask = async () => {
    if (newTaskText.trim() && user) {
      try {
        // In a real app, you'd have a patient selector here.
        // For now, we'll just say it's for the caregiver.
        await addTask({
          title: newTaskText,
          description: '', // Add a description field if needed
          completed: false,
          caregiverId: user.id,
          patientId: '', // Placeholder
          dueDate: new Date(), // Placeholder
        });
        if (user) {
          getTasksQuery(user.id).then(setTasksQuery);
        }
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
              if (user) {
                getTasksQuery(user.id).then(setTasksQuery);
              }
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
    <View className="flex-1 bg-gray-100">
      <View className="p-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold">Tareas</Text>
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
          <View className="bg-white p-4 m-2 rounded-lg flex-row items-center justify-between">
            <Button onPress={() => toggleCompletion(item)} className="flex-row items-center flex-1">
              <Ionicons name={item.completed ? 'checkbox' : 'square-outline'} size={24} color={item.completed ? 'green' : 'gray'} />
              <Text className={`ml-4 flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-black'}`}>{item.title}</Text>
            </Button>
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
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-lg w-11/12">
            <Text className="text-xl font-bold mb-4">Nueva Tarea</Text>
            <TextInput
              placeholder="Descripción de la tarea"
              value={newTaskText}
              onChangeText={setNewTaskText}
              className="bg-gray-200 p-3 rounded-lg mb-4"
            />
            <Button
              variant="primary"
              size="md"
              onPress={handleAddTask}
            >
              Agregar
            </Button>
            <Button
              variant="secondary"
              size="md"
              onPress={() => setModalVisible(false)}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}
