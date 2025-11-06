import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState, AppDispatch } from '../../src/store';
import { logout } from '../../src/store/slices/authSlice';

// Note: Removed NextMedicationCard, DailyMedicationItem, and VisualPillbox components
// along with their associated data structures and helpers to simplify the home screen.

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    gap: 4,
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  greeting: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  historyBtn: { backgroundColor: '#007AFF' },
  emergencyBtn: { backgroundColor: '#FF3B30' },
  logoutBtn: { backgroundColor: '#8E8E93' },
  headerBtnText: { color: 'white', fontWeight: '700' },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyRow: {
    color: '#8E8E93',
    paddingVertical: 12,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function PatientHome() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  // Emergency modal replaced with a simple alert to avoid missing component issues

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Paciente');

  const handleHistory = () => router.push('/patient/history');
  const handleEmergency = () => {
    Alert.alert('Emergencia', 'Si necesitas ayuda, contacta a tu cuidador o servicio de emergencia.');
  };
  const handleLogout = async () => {
    await dispatch(logout());
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>PILDHORA</Text>
          <Text style={styles.greeting}>Hola, {displayName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.headerBtn, styles.historyBtn]} onPress={handleHistory}>
            <Text style={styles.headerBtnText}>MI HISTORIAL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, styles.emergencyBtn]} onPress={handleEmergency}>
            <Text style={styles.headerBtnText}>EMERGENCIA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, styles.logoutBtn]} onPress={handleLogout}>
            <Text style={styles.headerBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Simplified content after component removals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bienvenido</Text>
        <View style={styles.card}>
          <Text style={{ color: '#1C1C1E', marginBottom: 8 }}>
            Tu panel ha sido simplificado. Puedes enlazar tu dispositivo o revisar tu historial.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.headerBtn, styles.historyBtn]} onPress={() => router.push('/patient/link-device')}>
              <Text style={styles.headerBtnText}>ENLAZAR DISPOSITIVO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, styles.historyBtn]} onPress={handleHistory}>
              <Text style={styles.headerBtnText}>VER HISTORIAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* EmergencyModal removed; using Alert for emergency action */}
    </ScrollView>
  );
}
