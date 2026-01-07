import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppBar } from '../../src/components/ui/AppBar';
import { RoleBasedSettings } from '../../src/components/shared/RoleBasedSettings';
import { colors } from '../../src/theme/tokens';

/**
 * Patient settings screen
 * 
 * Uses the shared RoleBasedSettings component which automatically
 * renders the patient variant based on the user's role.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export default function PatientSettings() {
  const router = useRouter();
  
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <AppBar 
        title="Ajustes" 
        showBackButton 
        onBackPress={() => router.back()} 
      />
      <View style={styles.content}>
        <RoleBasedSettings />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
