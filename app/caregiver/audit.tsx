import React, { useState, useEffect } from 'react';
import { Text, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { getAuditLogQuery } from '../../src/services/firebase/audit';
import { AuditLog } from '../../src/types';

export default function AuditScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [auditQuery, setAuditQuery] = useState<any>(null);

  useEffect(() => {
    if (user) {
      getAuditLogQuery(user.id).then(setAuditQuery);
    }
  }, [user]);

  const { data: auditLog = [] } = useCollectionSWR<AuditLog>(auditQuery);

  return (
    <View className="flex-1 bg-gray-100">
      <View className="p-4">
        <Text className="text-2xl font-bold">Registro de Actividad</Text>
      </View>
      <FlatList
        data={auditLog}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 m-2 rounded-lg flex-row items-start">
            <Ionicons name="receipt-outline" size={24} color="orange" className="mt-1" />
            <View className="ml-4 flex-1">
              <Text className="font-semibold">{item.action}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {new Date(item.timestamp.toString()).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-gray-500">No hay registros de actividad.</Text>
            </View>
        )}
      />
    </View>
  );
}
