import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Card, Container } from '../../src/components/ui';
import { PHTextFieldGroup } from '../../src/components/ui/PHTextFieldGroup';
import { PHTextField } from '../../src/components/ui/PHTextField';

export default function UITextFieldsShowcase() {
  const [value, setValue] = useState('Value');
  return (
    <Container style={styles.flex1}>
      <Card style={styles.card}>
        <Text style={styles.title}>Text Fields</Text>
        <View style={{ marginTop: 12 }}>
          <PHTextFieldGroup
            rows={[
              { kind: 'placeholder', text: 'Value' },
              { kind: 'input', props: { value, onChangeText: setValue }, showClear: true, onClear: () => setValue('') },
              { kind: 'value', text: 'Value' },
            ]}
          />
        </View>
        <View style={{ marginTop: 24 }}>
          <PHTextField placeholder="Email" keyboardType="email-address" />
        </View>
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  card: { padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold' },
});

