/**
 * VisualFeedbackExample Component
 * 
 * Demonstrates all visual feedback patterns implemented in the app:
 * - Button press feedback (scale, opacity)
 * - Card press feedback
 * - Loading spinners for async operations
 * - Success/error toasts
 * 
 * This component serves as a reference for implementing consistent
 * visual feedback throughout the application.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { useVisualFeedback } from '../../hooks/useVisualFeedback';
import { colors, spacing, typography, borderRadius } from '../../theme/tokens';

export const VisualFeedbackExample: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [asyncLoading, setAsyncLoading] = useState(false);

  // Custom press feedback example
  const { scaleAnim, opacityAnim, handlePressIn, handlePressOut } = useVisualFeedback({
    pressedScale: 0.92,
    pressedOpacity: 0.6,
  });

  /**
   * Simulate async operation with loading spinner
   */
  const handleAsyncOperation = async () => {
    setAsyncLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setAsyncLoading(false);
    showToast({
      message: 'Operación completada exitosamente',
      type: 'success',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Visual Feedback Examples</Text>

      {/* Button Press Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Button Press Feedback</Text>
        <Text style={styles.description}>
          Buttons automatically scale down and reduce opacity when pressed
        </Text>
        
        <View style={styles.buttonRow}>
          <Button
            variant="primary"
            onPress={() => showToast({ message: 'Primary button pressed', type: 'info' })}
          >
            Primary
          </Button>
          
          <Button
            variant="secondary"
            onPress={() => showToast({ message: 'Secondary button pressed', type: 'info' })}
          >
            Secondary
          </Button>
        </View>

        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={() => showToast({ message: 'Outline button pressed', type: 'info' })}
          >
            Outline
          </Button>
          
          <Button
            variant="danger"
            onPress={() => showToast({ message: 'Danger button pressed', type: 'warning' })}
          >
            Danger
          </Button>
        </View>
      </View>

      {/* Card Press Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Card Press Feedback</Text>
        <Text style={styles.description}>
          Cards with onPress prop show subtle scale and opacity animations
        </Text>
        
        <Card
          variant="elevated"
          padding="md"
          onPress={() => showToast({ message: 'Card pressed', type: 'info' })}
        >
          <Text style={styles.cardTitle}>Pressable Card</Text>
          <Text style={styles.cardText}>
            Tap this card to see the press animation
          </Text>
        </Card>

        <Card
          variant="outlined"
          padding="md"
          onPress={() => showToast({ message: 'Outlined card pressed', type: 'info' })}
        >
          <Text style={styles.cardTitle}>Outlined Pressable Card</Text>
          <Text style={styles.cardText}>
            This card has an outlined variant
          </Text>
        </Card>
      </View>

      {/* Loading Spinners */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Loading Spinners</Text>
        <Text style={styles.description}>
          Show loading state during async operations
        </Text>
        
        <Button
          variant="primary"
          loading={loading}
          onPress={() => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              showToast({ message: 'Loading complete', type: 'success' });
            }, 2000);
          }}
        >
          Button with Loading
        </Button>

        <View style={styles.spinnerContainer}>
          <LoadingSpinner size="small" />
          <LoadingSpinner size="large" />
        </View>

        <Button
          variant="secondary"
          onPress={handleAsyncOperation}
          disabled={asyncLoading}
        >
          Async Operation with Overlay
        </Button>

        {asyncLoading && (
          <LoadingSpinner
            size="large"
            overlay
            message="Procesando..."
          />
        )}
      </View>

      {/* Toast Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Toast Notifications</Text>
        <Text style={styles.description}>
          Display temporary success/error messages
        </Text>
        
        <View style={styles.buttonRow}>
          <Button
            variant="primary"
            size="sm"
            onPress={() => showToast({
              message: 'Operación exitosa',
              type: 'success',
            })}
          >
            Success
          </Button>
          
          <Button
            variant="danger"
            size="sm"
            onPress={() => showToast({
              message: 'Error al procesar',
              type: 'error',
            })}
          >
            Error
          </Button>
        </View>

        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => showToast({
              message: 'Advertencia importante',
              type: 'warning',
            })}
          >
            Warning
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onPress={() => showToast({
              message: 'Información útil',
              type: 'info',
            })}
          >
            Info
          </Button>
        </View>
      </View>

      {/* Custom Press Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Custom Press Feedback</Text>
        <Text style={styles.description}>
          Use useVisualFeedback hook for custom components
        </Text>
        
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <TouchableOpacity
            style={styles.customButton}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => showToast({ message: 'Custom feedback!', type: 'info' })}
            activeOpacity={1}
          >
            <Text style={styles.customButtonText}>Custom Animated Button</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Best Practices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Best Practices</Text>
        <View style={styles.bestPractices}>
          <Text style={styles.practiceItem}>
            ✓ Use Button component for standard buttons (includes feedback)
          </Text>
          <Text style={styles.practiceItem}>
            ✓ Use Card with onPress for pressable cards (includes feedback)
          </Text>
          <Text style={styles.practiceItem}>
            ✓ Show loading spinners during async operations
          </Text>
          <Text style={styles.practiceItem}>
            ✓ Display success toasts for completed actions
          </Text>
          <Text style={styles.practiceItem}>
            ✓ Display error toasts for failed operations
          </Text>
          <Text style={styles.practiceItem}>
            ✓ Use useVisualFeedback hook for custom components
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    lineHeight: typography.fontSize.base * 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  cardText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  spinnerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  customButton: {
    backgroundColor: colors.primary[500],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  customButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  bestPractices: {
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  practiceItem: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    lineHeight: typography.fontSize.base * 1.5,
  },
});
