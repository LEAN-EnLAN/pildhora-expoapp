import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { getMessagesQuery, sendMessage, Message } from '../../src/services/firebase/chat';
import { Timestamp } from 'firebase/firestore';

export default function ChatScreen() {
  const { patientId, patientName } = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);

  const [messagesQuery, setMessagesQuery] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: `Chat con ${patientName || 'Paciente'}` });
    if (user && patientId) {
      getMessagesQuery(user.id, patientId as string).then(setMessagesQuery);
    }
  }, [navigation, patientName, user, patientId]);

  const { data: messages = [], mutate } = useCollectionSWR<Message>(messagesQuery);

  const handleSend = async () => {
    if (newMessage.trim() && user && patientId) {
      const textToSend = newMessage;
      setNewMessage('');
      try {
        await sendMessage({
          text: textToSend,
          senderId: user.id,
          receiverId: patientId as string,
        });
        mutate();
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "No se pudo enviar el mensaje.");
        setNewMessage(textToSend); // Restore message on error
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCaregiver = item.senderId === user?.id;
    // Convert Firestore Timestamp to JS Date for display if needed
    const messageDate = item.createdAt instanceof Timestamp ? item.createdAt.toDate() : new Date();

    return (
      <View className={`p-3 m-2 rounded-lg max-w-[80%] ${isCaregiver ? 'bg-blue-500 self-end' : 'bg-white self-start'}`}>
        <Text className={`${isCaregiver ? 'text-white' : 'text-black'}`}>{item.text}</Text>
        <Text className={`text-xs mt-1 ${isCaregiver ? 'text-blue-100' : 'text-gray-500'} self-end`}>
          {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        className="p-2"
      />
      <View className="flex-row items-center p-2 border-t border-gray-200 bg-white">
        <TextInput
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChangeText={setNewMessage}
          className="flex-1 bg-gray-200 rounded-full px-4 py-2"
        />
        <TouchableOpacity onPress={handleSend} className="ml-2">
          <Ionicons name="send" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
