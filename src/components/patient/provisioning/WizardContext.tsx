import React, { createContext, useContext } from 'react';
import { DeviceProvisioningFormData } from './DeviceProvisioningWizard';

/**
 * Wizard context interface
 * 
 * Provides shared state and methods to all wizard step components.
 * This allows steps to update form data and control navigation validation.
 */
export interface WizardContextValue {
  /** Current form data across all steps */
  formData: DeviceProvisioningFormData;
  /** Update form data with partial updates */
  updateFormData: (updates: Partial<DeviceProvisioningFormData>) => void;
  /** Set whether the current step can proceed to next */
  setCanProceed: (canProceed: boolean) => void;
  /** User ID for the provisioning process */
  userId: string;
  /** Whether screen reader is active */
  isScreenReaderActive?: boolean;
  /** Whether reduce motion is enabled */
  isReduceMotionActive?: boolean;
  /** Skip provisioning and enter autonomous mode */
  onSkip?: () => void;
}

/**
 * Wizard context
 * 
 * Provides wizard state to all child components without prop drilling.
 */
const WizardContext = createContext<WizardContextValue | undefined>(undefined);

/**
 * Wizard provider component
 * 
 * Wraps the wizard and provides context to all steps.
 */
export const WizardProvider: React.FC<{
  value: WizardContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};

/**
 * Hook to access wizard context
 * 
 * Must be used within a WizardProvider.
 * 
 * @throws Error if used outside of WizardProvider
 * 
 * @example
 * ```typescript
 * function MyStep() {
 *   const { formData, updateFormData, setCanProceed } = useWizardContext();
 *   
 *   const handleChange = (deviceId: string) => {
 *     updateFormData({ deviceId });
 *     setCanProceed(deviceId.length > 0);
 *   };
 *   
 *   return <Input value={formData.deviceId} onChangeText={handleChange} />;
 * }
 * ```
 */
export function useWizardContext(): WizardContextValue {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error('useWizardContext must be used within a WizardProvider');
  }

  return context;
}
