import React from 'react';
import { RoleBasedSettings } from '../../src/components/shared/RoleBasedSettings';
import { ScreenWrapper } from '../../src/components/caregiver';

/**
 * Caregiver settings screen
 * 
 * Uses the shared RoleBasedSettings component which automatically
 * renders the caregiver variant based on the user's role.
 * 
 * Wrapped with ScreenWrapper to ensure content fits within safe viewing areas
 * between the persistent header and bottom navigation.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */
export default function CaregiverSettings() {
  return (
    <ScreenWrapper>
      <RoleBasedSettings />
    </ScreenWrapper>
  );
}
