import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { getReportsQuery, uploadReportFile, addReportMetadata } from '../../src/services/firebase/reports';
import { Report } from '../../src/types';

export default function ReportsScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const selectedPatientId = 'patient-1';

  const [reportsQuery, setReportsQuery] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      getReportsQuery(user.id).then(setReportsQuery);
    }
  }, [user]);

  const { data: reports = [], mutate } = useCollectionSWR<Report>(reportsQuery);

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
      
      const downloadURL = await uploadReportFile(uri, selectedPatientId, name);
      
      await addReportMetadata({
        name,
        fileUrl: downloadURL,
        fileType: mimeType || 'application/octet-stream',
        patientId: selectedPatientId,
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>
        <TouchableOpacity onPress={handleUploadReport} style={styles.uploadButton} disabled={uploading}>
          {uploading ? <ActivityIndicator color="white" /> : <Ionicons name="cloud-upload-outline" size={24} color="white" />}
        </TouchableOpacity>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => Linking.openURL(item.fileUrl)}
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
            <Text style={styles.emptyText}>No hay reportes.</Text>
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
