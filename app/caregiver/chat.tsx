import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHTextField } from '../../src/components/ui/PHTextField';
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

  const cacheKey = user?.id && patientId ? `messages:${user.id}:${patientId}` : null;
  const { data: messages = [] } = useCollectionSWR<Message>({
    cacheKey,
    query: messagesQuery,
  });

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
        // Data will be updated automatically through the real-time listener
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "No se pudo enviar el mensaje.");
        setNewMessage(textToSend); // Restore message on error
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCaregiver = item.senderId === user?.id;
    const messageDate = item.createdAt instanceof Timestamp ? item.createdAt.toDate() : new Date();

    return (
      <View style={[styles.messageContainer, isCaregiver ? styles.caregiverMessage : styles.patientMessage]}>
        <Text style={isCaregiver ? styles.caregiverText : styles.patientText}>{item.text}</Text>
        <Text style={[styles.timestamp, isCaregiver ? styles.caregiverTimestamp : styles.patientTimestamp]}>
          {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        style={styles.list}
      />
      <View style={styles.inputContainer}>
        <PHTextField
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  list: {
    padding: 8,
  },
  messageContainer: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
  },
  caregiverMessage: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-end',
  },
  patientMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  caregiverText: {
    color: '#FFFFFF',
  },
  patientText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  caregiverTimestamp: {
    color: '#DBEAFE',
  },
  patientTimestamp: {
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 8,
  },
});
