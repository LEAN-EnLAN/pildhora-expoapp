import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getDbInstance } from './index';
import { Task } from '../../types';

// Type for adding a new task, omitting Firestore-generated fields
type NewTaskPayload = Omit<Task, 'id' | 'createdAt'>;

/**
 * Creates a query to fetch tasks for a specific caregiver.
 * @param caregiverId - The ID of the caregiver.
 * @returns A Firestore query object.
 */
export const getTasksQuery = async (caregiverId: string) => {
  const db = await getDbInstance();
  return query(
    collection(db, 'tasks'),
    where('caregiverId', '==', caregiverId),
    orderBy('createdAt', 'desc')
  );
};

/**
 * Adds a new task to Firestore.
 * @param taskData - The data for the new task.
 * @returns The ID of the newly created task document.
 */
export const addTask = async (taskData: NewTaskPayload): Promise<string> => {
  const db = await getDbInstance();
  const docRef = await addDoc(collection(db, 'tasks'), {
    ...taskData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

/**
 * Updates an existing task in Firestore.
 * @param taskId - The ID of the task to update.
 * @param updates - An object containing the fields to update.
 */
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const db = await getDbInstance();
  const taskDoc = doc(db, 'tasks', taskId);
  await updateDoc(taskDoc, updates);
};

/**
 * Deletes a task from Firestore.
 * @param taskId - The ID of the task to delete.
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  const db = await getDbInstance();
  const taskDoc = doc(db, 'tasks', taskId);
  await deleteDoc(taskDoc);
};
