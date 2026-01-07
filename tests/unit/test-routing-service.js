/**
 * Test script for routing service
 * 
 * Tests the routing logic for post-authentication navigation
 * based on user role and onboarding status.
 */

const { getPostAuthRoute, hasCompletedSetup } = require('./src/services/routing');

// Mock the onboarding service
jest.mock('./src/services/onboarding', () => ({
  needsOnboarding: jest.fn()
}));

const { needsOnboarding } = require('./src/services/onboarding');

describe('RoutingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPostAuthRoute', () => {
    it('should route patient without device to provisioning wizard', async () => {
      const user = {
        id: 'patient-123',
        email: 'patient@example.com',
        name: 'Test Patient',
        role: 'patient',
        createdAt: new Date(),
        onboardingComplete: false,
        onboardingStep: 'device_provisioning'
      };

      needsOnboarding.mockResolvedValue(true);

      const route = await getPostAuthRoute(user);
      expect(route).toBe('/patient/device-provisioning');
      expect(needsOnboarding).toHaveBeenCalledWith('patient-123', 'patient');
    });

    it('should route caregiver without links to connection interface', async () => {
      const user = {
        id: 'caregiver-123',
        email: 'caregiver@example.com',
        name: 'Test Caregiver',
        role: 'caregiver',
        createdAt: new Date(),
        onboardingComplete: false,
        onboardingStep: 'device_connection',
        patients: []
      };

      needsOnboarding.mockResolvedValue(true);

      const route = await getPostAuthRoute(user);
      expect(route).toBe('/caregiver/device-connection');
      expect(needsOnboarding).toHaveBeenCalledWith('caregiver-123', 'caregiver');
    });

    it('should route patient with device to home', async () => {
      const user = {
        id: 'patient-123',
        email: 'patient@example.com',
        name: 'Test Patient',
        role: 'patient',
        createdAt: new Date(),
        onboardingComplete: true,
        deviceId: 'DEVICE-001'
      };

      needsOnboarding.mockResolvedValue(false);

      const route = await getPostAuthRoute(user);
      expect(route).toBe('/patient/home');
    });

    it('should route caregiver with links to dashboard', async () => {
      const user = {
        id: 'caregiver-123',
        email: 'caregiver@example.com',
        name: 'Test Caregiver',
        role: 'caregiver',
        createdAt: new Date(),
        onboardingComplete: true,
        patients: ['patient-456']
      };

      needsOnboarding.mockResolvedValue(false);

      const route = await getPostAuthRoute(user);
      expect(route).toBe('/caregiver/dashboard');
    });

    it('should throw error for invalid user', async () => {
      await expect(getPostAuthRoute(null)).rejects.toThrow('INVALID_USER');
    });

    it('should throw error for invalid user role', async () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'admin', // Invalid role
        createdAt: new Date(),
        onboardingComplete: false
      };

      await expect(getPostAuthRoute(user)).rejects.toThrow('INVALID_USER_ROLE');
    });
  });

  describe('hasCompletedSetup', () => {
    it('should return true if onboarding is marked complete', async () => {
      const user = {
        id: 'patient-123',
        email: 'patient@example.com',
        name: 'Test Patient',
        role: 'patient',
        createdAt: new Date(),
        onboardingComplete: true,
        deviceId: 'DEVICE-001'
      };

      const isComplete = await hasCompletedSetup(user);
      expect(isComplete).toBe(true);
      expect(needsOnboarding).not.toHaveBeenCalled();
    });

    it('should return false if user needs onboarding', async () => {
      const user = {
        id: 'patient-123',
        email: 'patient@example.com',
        name: 'Test Patient',
        role: 'patient',
        createdAt: new Date(),
        onboardingComplete: false
      };

      needsOnboarding.mockResolvedValue(true);

      const isComplete = await hasCompletedSetup(user);
      expect(isComplete).toBe(false);
      expect(needsOnboarding).toHaveBeenCalledWith('patient-123', 'patient');
    });

    it('should return true if user does not need onboarding', async () => {
      const user = {
        id: 'patient-123',
        email: 'patient@example.com',
        name: 'Test Patient',
        role: 'patient',
        createdAt: new Date(),
        onboardingComplete: false,
        deviceId: 'DEVICE-001'
      };

      needsOnboarding.mockResolvedValue(false);

      const isComplete = await hasCompletedSetup(user);
      expect(isComplete).toBe(true);
      expect(needsOnboarding).toHaveBeenCalledWith('patient-123', 'patient');
    });

    it('should throw error for invalid user', async () => {
      await expect(hasCompletedSetup(null)).rejects.toThrow('INVALID_USER');
    });
  });
});

console.log('✅ Routing service tests defined successfully');
console.log('Run with: npm test test-routing-service.js');
