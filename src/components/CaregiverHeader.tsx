import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CaregiverHeaderProps {
  title: string;
  showScreenTitle: boolean;
  onLogout: () => void;
}

export default function CaregiverHeader({ title, showScreenTitle, onLogout }: CaregiverHeaderProps) {
  const handleEmergency = () => console.log('Emergency pressed');

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.logo}>PILDHORA</Text>
        {showScreenTitle && (
          <Text style={styles.screenTitle}>{title}</Text>
        )}
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.emergencyButton]}
          onPress={handleEmergency}
        >
          <Ionicons name="alert" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={onLogout}
        >
          <Ionicons name="log-out" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  screenTitle: {
    fontSize: 18,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
  },
  logoutButton: {
    backgroundColor: '#374151',
  },
});
