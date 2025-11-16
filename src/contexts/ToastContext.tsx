/**
 * ToastContext
 * 
 * Provides global toast notification functionality throughout the app.
 * Allows components to show success, error, info, and warning messages.
 * 
 * @example
 * const { showToast } = useToast();
 * 
 * showToast({
 *   message: 'Medication saved successfully',
 *   type: 'success',
 * });
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Toast, ToastType } from '../components/ui/Toast';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastConfig | null>(null);

  const showToast = useCallback((config: ToastConfig) => {
    setToast(config);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <View style={styles.toastContainer}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onDismiss={hideToast}
          />
        </View>
      )}
    </ToastContext.Provider>
  );
};

/**
 * Hook to access toast functionality
 * 
 * @throws {Error} If used outside of ToastProvider
 * @returns {ToastContextValue} Toast context value with showToast and hideToast functions
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
