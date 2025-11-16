import { getDbInstance } from './firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Medication } from '../types';
import {
  withRetry,
  handleError,
  createValidationError,
  ApplicationError,
  ErrorCategory,
  ErrorSeverity,
} from '../utils/errorHandling';

/**
 * Status of medication inventory
 */
export interface InventoryStatus {
  currentQuantity: number;
  isLow: boolean;
  daysRemaining: number;
  estimatedRunOutDate: Date;
}

/**
 * Service for managing medication inventory tracking
 */
export class InventoryService {
  /**
   * Decrement the inventory quantity for a medication
   * @param medicationId - The ID of the medication
   * @param amount - The amount to decrement (default: 1)
   */
  async decrementInventory(medicationId: string, amount: number = 1): Promise<void> {
    try {
      // Validate input
      if (!medicationId) {
        throw createValidationError('Medication ID is required', { operation: 'decrement_inventory' });
      }
      if (amount <= 0) {
        throw createValidationError('Amount must be greater than 0', { operation: 'decrement_inventory', amount });
      }

      await withRetry(
        async () => {
          const db = await getDbInstance();
          if (!db) {
            throw new ApplicationError(
              ErrorCategory.INITIALIZATION,
              'Firestore database not available',
              'No se pudo conectar a la base de datos. Por favor, intenta nuevamente.',
              ErrorSeverity.HIGH,
              true
            );
          }

          const medicationRef = doc(db, 'medications', medicationId);
          const medicationSnap = await getDoc(medicationRef);

          if (!medicationSnap.exists()) {
            throw new ApplicationError(
              ErrorCategory.NOT_FOUND,
              'Medication not found',
              'El medicamento no fue encontrado.',
              ErrorSeverity.MEDIUM,
              false
            );
          }

          const medication = medicationSnap.data() as Medication;

          // Only decrement if inventory tracking is enabled
          if (!medication.trackInventory) {
            console.log('[InventoryService] Inventory tracking disabled for medication:', medicationId);
            return;
          }

          // Ensure currentQuantity exists
          if (medication.currentQuantity === undefined || medication.currentQuantity === null) {
            console.warn('[InventoryService] Current quantity not set for medication:', medicationId);
            return;
          }

          // Calculate new quantity (don't go below 0)
          const newQuantity = Math.max(0, medication.currentQuantity - amount);

          // Update the medication document
          await updateDoc(medicationRef, {
            currentQuantity: newQuantity,
            updatedAt: Timestamp.now(),
          });

          console.log('[InventoryService] Decremented inventory:', {
            medicationId,
            previousQuantity: medication.currentQuantity,
            newQuantity,
            amount,
          });
        },
        { maxAttempts: 3, initialDelayMs: 1000 },
        { operation: 'decrement_inventory', medicationId, amount }
      );
    } catch (error: any) {
      const appError = await handleError(
        error,
        { operation: 'decrement_inventory', medicationId, amount },
        false
      );
      console.error('[InventoryService] Error decrementing inventory:', appError.message);
      throw appError;
    }
  }

  /**
   * Refill the inventory for a medication
   * @param medicationId - The ID of the medication
   * @param newQuantity - The new quantity after refill
   */
  async refillInventory(medicationId: string, newQuantity: number): Promise<void> {
    try {
      // Validate input
      if (!medicationId) {
        throw createValidationError('Medication ID is required', { operation: 'refill_inventory' });
      }
      if (newQuantity < 0) {
        throw createValidationError('Quantity cannot be negative', { operation: 'refill_inventory', newQuantity });
      }

      await withRetry(
        async () => {
          const db = await getDbInstance();
          if (!db) {
            throw new ApplicationError(
              ErrorCategory.INITIALIZATION,
              'Firestore database not available',
              'No se pudo conectar a la base de datos. Por favor, intenta nuevamente.',
              ErrorSeverity.HIGH,
              true
            );
          }

          const medicationRef = doc(db, 'medications', medicationId);
          const medicationSnap = await getDoc(medicationRef);

          if (!medicationSnap.exists()) {
            throw new ApplicationError(
              ErrorCategory.NOT_FOUND,
              'Medication not found',
              'El medicamento no fue encontrado.',
              ErrorSeverity.MEDIUM,
              false
            );
          }

          const medication = medicationSnap.data() as Medication;

          // Only refill if inventory tracking is enabled
          if (!medication.trackInventory) {
            throw new ApplicationError(
              ErrorCategory.VALIDATION,
              'Inventory tracking is not enabled for this medication',
              'El seguimiento de inventario no está habilitado para este medicamento.',
              ErrorSeverity.MEDIUM,
              false
            );
          }

          // Update the medication document
          await updateDoc(medicationRef, {
            currentQuantity: newQuantity,
            lastRefillDate: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          console.log('[InventoryService] Refilled inventory:', {
            medicationId,
            newQuantity,
          });
        },
        { maxAttempts: 3, initialDelayMs: 1000 },
        { operation: 'refill_inventory', medicationId, newQuantity }
      );
    } catch (error: any) {
      const appError = await handleError(
        error,
        { operation: 'refill_inventory', medicationId, newQuantity },
        false
      );
      console.error('[InventoryService] Error refilling inventory:', appError.message);
      throw appError;
    }
  }

  /**
   * Check if the medication inventory is below the low quantity threshold
   * @param medicationId - The ID of the medication
   * @returns True if inventory is low, false otherwise
   */
  async checkLowQuantity(medicationId: string): Promise<boolean> {
    try {
      const db = await getDbInstance();
      if (!db) {
        throw new Error('Firestore database not available');
      }

      const medicationRef = doc(db, 'medications', medicationId);
      const medicationSnap = await getDoc(medicationRef);

      if (!medicationSnap.exists()) {
        throw new Error('Medication not found');
      }

      const medication = medicationSnap.data() as Medication;

      // If inventory tracking is disabled, return false
      if (!medication.trackInventory) {
        return false;
      }

      // If currentQuantity or threshold is not set, return false
      if (
        medication.currentQuantity === undefined ||
        medication.currentQuantity === null ||
        medication.lowQuantityThreshold === undefined ||
        medication.lowQuantityThreshold === null
      ) {
        return false;
      }

      return medication.currentQuantity <= medication.lowQuantityThreshold;
    } catch (error) {
      console.error('[InventoryService] Error checking low quantity:', error);
      return false;
    }
  }

  /**
   * Get the inventory status for a medication
   * @param medicationId - The ID of the medication
   * @returns The inventory status
   */
  async getInventoryStatus(medicationId: string): Promise<InventoryStatus> {
    try {
      const db = await getDbInstance();
      if (!db) {
        throw new Error('Firestore database not available');
      }

      const medicationRef = doc(db, 'medications', medicationId);
      const medicationSnap = await getDoc(medicationRef);

      if (!medicationSnap.exists()) {
        throw new Error('Medication not found');
      }

      const medication = medicationSnap.data() as Medication;

      // Default values if inventory tracking is disabled or data is missing
      if (
        !medication.trackInventory ||
        medication.currentQuantity === undefined ||
        medication.currentQuantity === null
      ) {
        return {
          currentQuantity: 0,
          isLow: false,
          daysRemaining: 0,
          estimatedRunOutDate: new Date(),
        };
      }

      // Calculate doses per day based on medication schedule
      const dosesPerDay = this.calculateDosesPerDay(medication);

      // Calculate days remaining
      const daysRemaining = dosesPerDay > 0 
        ? Math.floor(medication.currentQuantity / dosesPerDay)
        : 0;

      // Calculate estimated run out date
      const estimatedRunOutDate = new Date();
      estimatedRunOutDate.setDate(estimatedRunOutDate.getDate() + daysRemaining);

      // Check if inventory is low
      const isLow = medication.lowQuantityThreshold !== undefined &&
        medication.lowQuantityThreshold !== null &&
        medication.currentQuantity <= medication.lowQuantityThreshold;

      return {
        currentQuantity: medication.currentQuantity,
        isLow,
        daysRemaining,
        estimatedRunOutDate,
      };
    } catch (error) {
      console.error('[InventoryService] Error getting inventory status:', error);
      throw error;
    }
  }

  /**
   * Calculate the low quantity threshold based on dosing schedule
   * @param medication - The medication object
   * @returns The calculated threshold (minimum 3 days of doses)
   */
  calculateLowQuantityThreshold(medication: Medication): number {
    const dosesPerDay = this.calculateDosesPerDay(medication);
    
    // Minimum 3 days buffer as per requirements
    const minDaysBuffer = 3;
    const threshold = Math.ceil(dosesPerDay * minDaysBuffer);
    
    console.log('[InventoryService] Calculated threshold:', {
      medicationName: medication.name,
      dosesPerDay,
      threshold,
    });
    
    return threshold;
  }

  /**
   * Calculate doses per day based on medication schedule
   * @param medication - The medication object
   * @returns The average number of doses per day
   */
  private calculateDosesPerDay(medication: Medication): number {
    // Number of times per day
    const timesPerDay = medication.times?.length || 0;
    
    if (timesPerDay === 0) {
      return 0;
    }

    // Parse frequency to determine days per week
    const frequency = medication.frequency || '';
    const days = frequency.split(',').map(s => s.trim()).filter(d => d.length > 0);
    const daysPerWeek = days.length || 7; // Default to daily if not specified

    // Calculate average doses per day
    const avgDosesPerWeek = timesPerDay * daysPerWeek;
    const avgDosesPerDay = avgDosesPerWeek / 7;

    return avgDosesPerDay;
  }

  /**
   * Parse dose amount from medication data
   * @param medication - The medication object
   * @returns The numeric dose amount (default: 1)
   * 
   * IMPORTANT: This returns the number of UNITS to decrement per dose,
   * NOT the dose value (mg, ml, etc.). For countable items like tablets
   * and capsules, this should always be 1 unless specified otherwise.
   * 
   * The doseValue field represents the STRENGTH of the medication (e.g., "50" for 50mg),
   * NOT the number of units to take. Inventory tracking counts discrete units (tablets, bottles, etc.)
   */
  parseDoseAmount(medication: Medication): number {
    // For countable quantity types, always decrement by 1 unit
    const countableTypes = ['tablets', 'capsules', 'pills', 'drops', 'sprays', 'puffs', 'inhalations', 'applications'];
    
    if (medication.quantityType && countableTypes.includes(medication.quantityType.toLowerCase())) {
      return 1;
    }

    // For liquid medications, check if there's a specific amount per dose
    // This would need to be stored separately from doseValue
    // For now, default to 1 unit (e.g., 1 bottle, 1 container)
    if (medication.quantityType === 'liquid' || medication.quantityType === 'cream') {
      // TODO: Add support for tracking partial containers
      // For now, assume each dose doesn't decrement inventory
      // (user tracks full containers, not individual doses)
      return 0;
    }

    // CRITICAL FIX: If quantityType is not set, check if inventory tracking is enabled
    // If inventory tracking is enabled, it means the user is tracking discrete units
    // Therefore, we should ALWAYS decrement by 1, not by the doseValue
    if (medication.trackInventory) {
      return 1;
    }

    // Default to 1 dose for unknown types
    return 1;
  }
}

// Export a singleton instance
export const inventoryService = new InventoryService();
