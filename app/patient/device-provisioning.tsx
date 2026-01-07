import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { DeviceProvisioningWizard } from '../../src/components/patient/provisioning/DeviceProvisioningWizard';
import { ContinueSetupPrompt } from '../../src/components/patient/provisioning/ContinueSetupPrompt';
import { wizardPersistenceService } from '../../src/services/wizardPersistence';
import { RootState } from '../../src/store';
import { colors, spacing, typography } from '../../src/theme/tokens';

/**
 * Device Provisioning Screen
 * 
 * Entry point for the device provisioning wizard. This screen is shown to
 * new patients who need to set up their medication dispenser device.
 * 
 * Flow:
 * 1. User completes signup
 * 2. Routing service detects no device linked
 * 3. User is redirected here
 * 4. Wizard guides through device setup
 * 5. On completion, user is redirected to patient home
 */
export default function DeviceProvisioningScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingProgress, setIsCheckingProgress] = useState(true);
  const [savedProgress, setSavedProgress] = useState<{
    currentStep: number;
    progressAge: number;
  } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [resumeFromSaved, setResumeFromSaved] = useState(false);

  // Check for saved progress on mount
  useEffect(() => {
    if (!user) {
      setIsCheckingProgress(false);
      return;
    }

    const checkProgress = async () => {
      try {
        const progress = await wizardPersistenceService.restoreProgress(user.id);
        
        if (progress && progress.currentStep > 0 && progress.currentStep < 5) {
          const age = Date.now() - progress.timestamp;
          setSavedProgress({
            currentStep: progress.currentStep,
            progressAge: age,
          });
          setShowPrompt(true);
        }
      } catch (error) {
        console.error('[DeviceProvisioningScreen] Error checking progress:', error);
      } finally {
        setIsCheckingProgress(false);
      }
    };

    checkProgress();
  }, [user]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      // The wizard handles all the provisioning logic internally
      // Once complete, navigate to patient home
      router.replace('/patient/home');
    } catch (error) {
      console.error('[DeviceProvisioningScreen] Error completing provisioning:', error);
      setIsSubmitting(false);
    }
  }, [router]);

  // Handle wizard cancellation
  const handleWizardCancel = useCallback(() => {
    // For now, go back to previous screen
    // In production, might want to show a warning about incomplete setup
    router.back();
  }, [router]);

  // Handle continue from saved progress
  const handleContinue = useCallback(() => {
    setShowPrompt(false);
    setResumeFromSaved(true);
  }, []);

  // Handle start fresh
  const handleStartFresh = useCallback(async () => {
    try {
      await wizardPersistenceService.clearProgress();
      setShowPrompt(false);
      setResumeFromSaved(false);
      setSavedProgress(null);
    } catch (error) {
      console.error('[DeviceProvisioningScreen] Error clearing progress:', error);
    }
  }, []);

  if (!user) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error[500]} />
          <Text style={styles.errorText}>Usuario no autenticado</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while checking for saved progress
  if (isCheckingProgress) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* Continue Setup Prompt */}
      {showPrompt && savedProgress && (
        <ContinueSetupPrompt
          currentStep={savedProgress.currentStep}
          totalSteps={6}
          progressAge={savedProgress.progressAge}
          onContinue={handleContinue}
          onStartFresh={handleStartFresh}
        />
      )}

      {/* Device Provisioning Wizard */}
      {!showPrompt && (
        <DeviceProvisioningWizard
          userId={user.id}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
          resumeFromSaved={resumeFromSaved}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[700],
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
