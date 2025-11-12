import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { getReportsQuery, uploadReportFile, addReportMetadata } from '../../src/services/firebase/reports';
import { Report } from '../../src/types';
import { useRouter } from 'expo-router';
import { getCaregiverPatients } from '../../src/services/firebase/user';

export default function ReportsScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedTargetId, setSelectedTargetId] = useState('dummy-patient');

  const [reportsQuery, setReportsQuery] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [noPatientFound, setNoPatientFound] = useState(false);
  const [dummyReports, setDummyReports] = useState<Report[]>([]);

  useEffect(() => {
    if (user) {
      getReportsQuery(user.id).then(setReportsQuery);
    }
  }, [user]);

  useEffect(() => {
    const checkPatients = async () => {
      if (!user?.id) return;
      const patients = await getCaregiverPatients(user.id);
      if (!patients || patients.length === 0) {
        setNoPatientFound(true);
        router.replace('/caregiver/add-device');
      } else {
        setNoPatientFound(false);
        const first = patients[0];
        if (first.deviceId) {
          setSelectedTargetId(first.deviceId);
        }
      }
    };
    checkPatients();
  }, [user]);

  useEffect(() => {
    const caregiverId = user?.id ?? 'dummy';
    const now = new Date().toISOString();
    setDummyReports([
      { id: 'dummy-1', name: 'Reporte de ejemplo', fileUrl: '#', fileType: 'application/pdf', patientId: selectedTargetId, caregiverId, createdAt: now },
      { id: 'dummy-2', name: 'Imagen de muestra', fileUrl: '#', fileType: 'image/jpeg', patientId: selectedTargetId, caregiverId, createdAt: now },
    ]);
  }, [user]);

  const cacheKey = user?.id ? `reports:${user.id}` : null;
  const { data: reports = [], mutate } = useCollectionSWR<Report>({
    cacheKey,
    query: reportsQuery,
  });

  const handleUploadReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const { uri, name, mimeType } = result.assets[0];

      if (!user) {
        Alert.alert("Error", "You must be logged in to upload files.");
        return;
      }

      setUploading(true);
      
      const downloadURL = await uploadReportFile(uri, selectedTargetId, name);
      
      await addReportMetadata({
        name,
        fileUrl: downloadURL,
        fileType: mimeType || 'application/octet-stream',
        patientId: selectedTargetId,
        caregiverId: user.id,
      });

      mutate();
      Alert.alert("Éxito", "El reporte se ha subido correctamente.");

    } catch (error) {
      console.error("Error uploading report:", error);
      Alert.alert("Error", "No se pudo subir el reporte.");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType === 'application/pdf') return 'document-text';
    return 'document-outline';
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>
        <TouchableOpacity onPress={handleUploadReport} style={styles.uploadButton} disabled={uploading}>
          {uploading ? <ActivityIndicator color="white" /> : <Ionicons name="cloud-upload-outline" size={24} color="white" />}
        </TouchableOpacity>
      </View>
      <FlatList
        data={reports.length ? reports : dummyReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => item.fileUrl !== '#' ? Linking.openURL(item.fileUrl) : null}
            style={styles.reportItem}
          >
            <View style={styles.reportInfo}>
              <Ionicons name={getFileIcon(item.fileType)} size={32} color="purple" />
              <View style={styles.reportTextContainer}>
                <Text style={styles.reportName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.reportDate}>
                  {new Date(item.createdAt.toString()).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-down-circle-outline" size={24} color="gray" />
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    padding: 8,
    borderRadius: 20,
  },
  reportItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  reportName: {
    fontWeight: '600',
  },
  reportDate: {
    color: '#6B7280',
    fontSize: 12,
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
