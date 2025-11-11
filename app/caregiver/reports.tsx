import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store';
import { useCollectionSWR } from '../../src/hooks/useCollectionSWR';
import { getReportsQuery, uploadReportFile, addReportMetadata } from '../../src/services/firebase/reports';
import { Report } from '../../src/types';

export default function ReportsScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  // In a real app with multiple patients, you'd get this from a selector
  const selectedPatientId = 'patient-1'; // Placeholder patient ID

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

      mutate(); // Refresh the list
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
    <View className="flex-1 bg-gray-100">
      <View className="p-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold">Reportes</Text>
        <TouchableOpacity onPress={handleUploadReport} className="bg-blue-500 p-2 rounded-full" disabled={uploading}>
          {uploading ? <ActivityIndicator color="white" /> : <Ionicons name="cloud-upload-outline" size={24} color="white" />}
        </TouchableOpacity>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => Linking.openURL(item.fileUrl)}
            className="bg-white p-4 m-2 rounded-lg flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name={getFileIcon(item.fileType)} size={32} color="purple" />
              <View className="ml-4 flex-1">
                <Text className="font-semibold" numberOfLines={1}>{item.name}</Text>
                <Text className="text-gray-500 text-xs">
                  {new Date(item.createdAt.toString()).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-down-circle-outline" size={24} color="gray" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-gray-500">No hay reportes.</Text>
          </View>
        )}
      />
    </View>
  );
}
