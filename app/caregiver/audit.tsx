import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Actividad</Text>
      </View>
      <FlatList
        data={auditLog}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Ionicons name="receipt-outline" size={24} color="orange" style={styles.icon} />
            <View style={styles.logContent}>
              <Text style={styles.logAction}>{item.action}</Text>
              <Text style={styles.logTimestamp}>
                {new Date(item.timestamp.toString()).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay registros de actividad.</Text>
            </View>
        )}
      />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginTop: 4,
  },
  logContent: {
    marginLeft: 16,
    flex: 1,
  },
  logAction: {
    fontWeight: '600',
  },
  logTimestamp: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: '#6B7280',
  },
});
