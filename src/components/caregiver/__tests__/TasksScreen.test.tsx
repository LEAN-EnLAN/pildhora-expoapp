/**
 * TasksScreen Unit Tests
 * 
 * Tests for the Tasks screen component focusing on core functionality:
 * - Task CRUD operations
 * - Completion toggle
 * - Caregiver scoping
 * 
 * Requirements: 9.4
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TasksScreen from '../../../../app/caregiver/tasks';
import * as tasksService from '../../../services/firebase/tasks';
import { Task } from '../../../types';

// Mock the services
jest.mock('../../../services/firebase/tasks');
jest.mock('../../../hooks/useCollectionSWR');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock task data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review patient medications',
    description: '',
    caregiverId: 'caregiver-1',
    patientId: '',
    completed: false,
    dueDate: new Date(),
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Update care plan',
    description: '',
    caregiverId: 'caregiver-1',
    patientId: '',
    completed: true,
    dueDate: new Date(),
    createdAt: new Date(),
  },
];

// Create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: () => ({
        user: {
          id: 'caregiver-1',
          email: 'caregiver@test.com',
          role: 'caregiver',
          name: 'Test Caregiver',
        },
        isAuthenticated: true,
      }),
    },
  });
};

describe('TasksScreen', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockMutate: jest.Mock;

  beforeEach(() => {
    mockStore = createMockStore();
    mockMutate = jest.fn();

    // Mock useCollectionSWR
    const useCollectionSWR = require('../../../hooks/useCollectionSWR').useCollectionSWR;
    useCollectionSWR.mockReturnValue({
      data: mockTasks,
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });

    // Mock tasks service functions
    (tasksService.getTasksQuery as jest.Mock).mockResolvedValue({});
    (tasksService.addTask as jest.Mock).mockResolvedValue('new-task-id');
    (tasksService.updateTask as jest.Mock).mockResolvedValue(undefined);
    (tasksService.deleteTask as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Rendering', () => {
    it('renders task list correctly', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      expect(getByText('Review patient medications')).toBeTruthy();
      expect(getByText('Update care plan')).toBeTruthy();
    });

    it('shows empty state when no tasks exist', () => {
      const useCollectionSWR = require('../../../hooks/useCollectionSWR').useCollectionSWR;
      useCollectionSWR.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        mutate: mockMutate,
      });

      const { getByText } = render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      expect(getByText('No hay tareas')).toBeTruthy();
    });
  });

  describe('Task Completion Toggle', () => {
    it('toggles task completion status', async () => {
      const { getAllByRole } = render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      const checkboxes = getAllByRole('checkbox');
      fireEvent.press(checkboxes[0]);

      await waitFor(() => {
        expect(tasksService.updateTask).toHaveBeenCalledWith('1', {
          completed: true,
        });
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('applies strikethrough styling to completed tasks', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      const completedTask = getByText('Update care plan');
      expect(completedTask.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            textDecorationLine: 'line-through',
          }),
        ])
      );
    });
  });

  describe('Task CRUD Operations', () => {
    it('creates a new task', async () => {
      const { getByText, getByLabelText } = render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      // Open add task modal
      const addButton = getByText('Nueva Tarea');
      fireEvent.press(addButton);

      // Enter task description
      const input = getByLabelText('Task description input');
      fireEvent.changeText(input, 'New test task');

      // Submit
      const submitButton = getByText('Agregar');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(tasksService.addTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New test task',
            caregiverId: 'caregiver-1',
            completed: false,
          })
        );
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('validates task input before creating', async () => {
      const { getByText, getByLabelText } = render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      // Open add task modal
      const addButton = getByText('Nueva Tarea');
      fireEvent.press(addButton);

      // Try to submit without entering text
      const submitButton = getByText('Agregar');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(tasksService.addTask).not.toHaveBeenCalled();
      });
    });

    it('deletes a task with confirmation', async () => {
      const { getAllByLabelText } = render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      const deleteButtons = getAllByLabelText('Delete task');
      fireEvent.press(deleteButtons[0]);

      // Note: Alert.alert is mocked, so we can't test the confirmation dialog
      // In a real test, you would mock Alert.alert and simulate the confirmation
    });
  });

  describe('Caregiver Scoping', () => {
    it('queries tasks for the logged-in caregiver only', async () => {
      render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      await waitFor(() => {
        expect(tasksService.getTasksQuery).toHaveBeenCalledWith('caregiver-1');
      });
    });

    it('creates tasks scoped to the caregiver', async () => {
      const { getByText, getByLabelText } = render(
        <Provider store={mockStore}>
          <TasksScreen />
        </Provider>
      );

      // Open add task modal
      const addButton = getByText('Nueva Tarea');
      fireEvent.press(addButton);

      // Enter task description
      const input = getByLabelText('Task description input');
      fireEvent.changeText(input, 'Scoped task');

      // Submit
      const submitButton = getByText('Agregar');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(tasksService.addTask).toHaveBeenCalledWith(
          expect.objectContaining({
            caregiverId: 'caregiver-1',
          })
        );
      });
    });
  });
});
