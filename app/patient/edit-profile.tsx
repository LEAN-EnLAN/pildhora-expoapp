import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState, AppDispatch } from '../../src/store';
import { updateProfile } from '../../src/store/slices/authSlice';
import { Card, Button, SuccessMessage, ErrorMessage } from '../../src/components/ui';
import { PHTextField } from '../../src/components/ui/PHTextField';
import { colors, spacing, typography, borderRadius } from '../../src/theme/tokens';

export default function EditProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const initials = useMemo(() => {
    if (!user?.name) return (user?.email || 'P')[0]?.toUpperCase?.() || 'P';
    return user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('');
  }, [user]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('El nombre no puede estar vacío');
      setSuccessMessage(null);
      return;
    }

    try {
      setErrorMessage(null);
      const result = await dispatch(updateProfile({ name: trimmed })).unwrap();
      setSuccessMessage('Perfil actualizado. Tus datos de acceso en Firebase no se modificaron.');

      // Keep the screen for a moment so the user can see the confirmation
      if (result?.name === trimmed) {
        setTouched(false);
      }
    } catch (error: any) {
      const message = typeof error === 'string' ? error : (error?.message || 'Error al actualizar el perfil');
      setErrorMessage(message);
      setSuccessMessage(null);
    }
  };

  const hasChanges = useMemo(() => {
    const currentName = user?.name || '';
    return name.trim() !== currentName.trim();
  }, [name, user?.name]);

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Editar perfil</Text>
          <Text style={styles.headerSubtitle}>
            Ajusta cómo aparece tu información sin cambiar tu inicio de sesión.
          </Text>
        </View>

        {/* Messages */}
        {successMessage && (
          <View style={styles.messageContainer}>
            <SuccessMessage
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
              autoDismiss
              duration={3000}
            />
          </View>
        )}
        {errorMessage && (
          <View style={styles.messageContainer}>
            <ErrorMessage
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              variant="banner"
            />
          </View>
        )}

        {/* Profile summary */}
        <View style={styles.section}>
          <Card variant="elevated" padding="lg">
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'Paciente'}</Text>
                <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Editable fields */}
        <View style={styles.section}>
          <Card padding="lg">
            <Text style={styles.fieldLabel}>Nombre completo</Text>
            <PHTextField
              value={name}
              placeholder="Ingresa tu nombre completo"
              autoCapitalize="words"
              onChangeText={(text) => {
                setName(text);
                if (!touched) setTouched(true);
              }}
            />

            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Importante</Text>
              <Text style={styles.warningText}>
                Este cambio solo actualiza tu nombre visible en la app. Tu correo electrónico y tus credenciales
                de inicio de sesión guardadas en Firebase no se modificarán.
              </Text>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.footerSection}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleSave}
            disabled={loading || !hasChanges || !name.trim()}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>

          <Button
            variant="secondary"
            size="md"
            style={styles.cancelButton}
            onPress={() => router.back()}
            accessibilityLabel="Cancelar edición de perfil"
          >
            Cancelar
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarInitials: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  warningBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  warningTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning[500],
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[700],
  },
  footerSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
});
