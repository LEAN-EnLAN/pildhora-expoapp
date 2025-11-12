import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { getAuditLogQuery } from '../../src/services/firebase/audit';
import { AuditLog } from '../../src/types';
import { useRouter } from 'expo-router';
import { getCaregiverPatients } from '../../src/services/firebase/user';

export default function AuditScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [auditQuery, setAuditQuery] = useState<any>(null);
  const [dummyAudit, setDummyAudit] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (user) {
      getAuditLogQuery(user.id).then(setAuditQuery);
    }
  }, [user]);

  useEffect(() => {
    const checkPatients = async () => {
      if (!user?.id) return;
      const patients = await getCaregiverPatients(user.id);
      if (!patients || patients.length === 0) {
        router.replace('/caregiver/add-device');
      }
    };
    checkPatients();
  }, [user]);

  useEffect(() => {
    const now = new Date().toISOString();
    setDummyAudit([
      { id: 'dummy-a1', action: 'Ejemplo: paciente tomó medicación', timestamp: now, userId: 'dummy', caregiverId: user?.id ?? 'dummy' },
    ]);
  }, [user]);

  const cacheKey = user?.id ? `audit:${user.id}` : null;
  const { data: fetchedAudit = [], isLoading } = useCollectionSWR<AuditLog>({
    cacheKey,
    query: auditQuery,
    initialData: dummyAudit,
  });

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Actividad</Text>
      </View>
      <FlatList
        data={fetchedAudit}
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
              <Text style={styles.emptyText}>No hay datos disponibles.</Text>
            </View>
        )}
      />
    </SafeAreaView>
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
