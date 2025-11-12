import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { PHTextField } from '../../ui/PHTextField';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export default function MedicationNameInput({ value, onChangeText, error }: Props) {
  // Auto-capitalize first letter of medication name
  const handleNameChange = (text: string) => {
    if (text.length === 1) {
      onChangeText(text.toUpperCase());
    } else {
      onChangeText(text);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre del Medicamento</Text>
      <PHTextField
        placeholder="Nombre"
        value={value}
        onChangeText={handleNameChange}
        autoCapitalize="words"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  inputError: {},
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
});
