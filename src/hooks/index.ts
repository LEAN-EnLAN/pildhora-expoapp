/**
 * Hooks index
 * 
 * Central export point for all custom React hooks
 */

export { useUserRole } from './useUserRole';
export { useLinkedPatients } from './useLinkedPatients';
export { useDeviceState } from './useDeviceState';
export { useLatestMedicationEvent } from './useLatestMedicationEvent';
export { useCollectionSWR } from './useCollectionSWR';
export { useSyncStatus } from './useSyncStatus';
export { useVisualFeedback } from './useVisualFeedback';
export { useNavigationPersistence } from './useNavigationPersistence';
export { useCaregiverSecurity } from './useCaregiverSecurity';
export { useNetworkStatus } from './useNetworkStatus';
export { useTopoAlarm } from './useTopoAlarm';
export { useDeviceSettings } from './useDeviceSettings';
export type { DeviceInfo, LinkedCaregiver, DeviceConfigInput, UseDeviceSettingsReturn } from './useDeviceSettings';
export { useDeviceLinks } from './useDeviceLinks';
export { usePastilleroStatus } from './usePastilleroStatus';
export type { UsePastilleroStatusResult, UsePastilleroStatusOptions } from './usePastilleroStatus';
export { useScheduleSync } from './useScheduleSync';
