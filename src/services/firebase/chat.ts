import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { getDbInstance } from './index';
import * as user from './user';

export interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
  senderId: string;
  receiverId: string;
}

type NewMessagePayload = Omit<Message, 'id' | 'createdAt'>;

/**
 * Generates a consistent chat ID for two users.
 * @param userId1 - First user's ID.
 * @param userId2 - Second user's ID.
 * @returns A sorted, concatenated chat ID.
 */
const getChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Sends a new message and saves it to the correct chat document.
 * @param messageData - The data for the new message.
 */
export const sendMessage = async (messageData: NewMessagePayload): Promise<void> => {
  const db = await getDbInstance();
  const sender = await user.getPatientById(messageData.senderId);
  if (!sender) {
    throw new Error('Sender not found.');
  }

  const [caregiverId, patientId] =
    sender.role === 'caregiver'
      ? [messageData.senderId, messageData.receiverId]
      : [messageData.receiverId, messageData.senderId];

  const patients = await user.getCaregiverPatients(caregiverId);
  if (!patients.some(p => p.id === patientId)) {
    throw new Error('Unauthorized: Caregiver cannot message this patient.');
  }
  const chatId = getChatId(messageData.senderId, messageData.receiverId);
  const chatDocRef = doc(db, 'chats', chatId);
  const messagesColRef = collection(chatDocRef, 'messages');

  // Ensure the chat document exists
  const chatDoc = await getDoc(chatDocRef);
  if (!chatDoc.exists()) {
    await setDoc(chatDocRef, {
      participants: [messageData.senderId, messageData.receiverId],
      lastMessage: Timestamp.now(),
    });
  }

  await addDoc(messagesColRef, {
    ...messageData,
    createdAt: Timestamp.now(),
  });
};

/**
 * Creates a real-time listener for messages in a specific chat.
 * @param caregiverId - The caregiver's user ID.
 * @param patientId - The patient's user ID.
 * @returns A Firestore query object for use with SWR or other hooks.
 */
export const getMessagesQuery = async (caregiverId: string, patientId: string) => {
  const db = await getDbInstance();
  const chatId = getChatId(caregiverId, patientId);
  const messagesColRef = collection(db, 'chats', chatId, 'messages');

  return query(messagesColRef, orderBy('createdAt', 'desc'), limit(50));
};
