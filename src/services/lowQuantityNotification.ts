import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inventoryService, InventoryStatus } from './inventoryService';
import { getDbInstance } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Medication } from '../types';

const LAST_CHECK_KEY = '@lowQuantityNotification:lastCheck';
const NOTIFIED_MEDS_KEY = '@lowQuantityNotification:notifiedMeds';

/**
 * Service for managing low quantity notifications
 * Handles notification triggers and daily background checks
 */
export class LowQuantityNotificationService {
  /**
   * Show a low quantity notification for a specific medication
   * @param medication - The medication with low inventory
   * @param status - The inventory status
   */
  async showLowQuantityNotification(
    medication: Medication,
    status: InventoryStatus
  ): Promise<void> {
    try {
      // Check if we've already notified for this medication today
      const notifiedMeds = await this.getNotifiedMedicationsToday();
      
      if (notifiedMeds.has(medication.id)) {
        console.log('[LowQuantityNotification] Already notified for medication today:', medication.name);
        return;
      }

      // Determine notification message based on quantity
      // Note: currentQuantity refers to INVENTORY (pills in bottle), not today's doses
      const isOutOfStock = status.currentQuantity === 0;
      const title = isOutOfStock ? '¡Medicamento agotado!' : '⚠️ Inventario bajo';
      const message = isOutOfStock
        ? `No quedan unidades de ${medication.name} en tu inventario.\n\nReabastece lo antes posible.`
        : `Solo quedan ${status.currentQuantity} unidades de ${medication.name} en tu inventario.\n\nAproximadamente ${status.daysRemaining} ${status.daysRemaining === 1 ? 'día' : 'días'} de tratamiento restante.`;

      // Show alert
      Alert.alert(title, message, [
        {
          text: 'Entendido',
          onPress: async () => {
            // Mark as notified
            await this.markMedicationAsNotified(medication.id);
          },
        },
      ]);

      console.log('[LowQuantityNotification] Notification shown for:', medication.name);
    } catch (error) {
      console.error('[LowQuantityNotification] Error showing notification:', error);
    }
  }

  /**
   * Check all medications for low inventory and show notifications
   * @param patientId - The patient ID to check medications for
   */
  async checkAllMedicationsForLowInventory(patientId: string): Promise<void> {
    try {
      console.log('[LowQuantityNotification] Checking all medications for patient:', patientId);

      const db = await getDbInstance();
      if (!db) {
        console.error('[LowQuantityNotification] Firestore not available');
        return;
      }

      // Query all medications for this patient with inventory tracking enabled
      const q = query(
        collection(db, 'medications'),
        where('patientId', '==', patientId),
        where('trackInventory', '==', true)
      );

      const snapshot = await getDocs(q);
      const medications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Medication[];

      console.log('[LowQuantityNotification] Found medications with tracking:', medications.length);

      // Check each medication
      for (const medication of medications) {
        try {
          const isLow = await inventoryService.checkLowQuantity(medication.id);

          if (isLow) {
            const status = await inventoryService.getInventoryStatus(medication.id);
            console.log('[LowQuantityNotification] Low inventory detected:', {
              name: medication.name,
              currentQuantity: status.currentQuantity,
              daysRemaining: status.daysRemaining,
            });

            // Show notification
            await this.showLowQuantityNotification(medication, status);
          }
        } catch (error) {
          console.error('[LowQuantityNotification] Error checking medication:', medication.name, error);
        }
      }
    } catch (error) {
      console.error('[LowQuantityNotification] Error checking all medications:', error);
    }
  }

  /**
   * Check if daily inventory check should run
   * Returns true if last check was more than 24 hours ago or never run
   */
  async shouldRunDailyCheck(): Promise<boolean> {
    try {
      const lastCheckStr = await AsyncStorage.getItem(LAST_CHECK_KEY);

      if (!lastCheckStr) {
        return true; // Never run before
      }

      const lastCheck = new Date(lastCheckStr);
      const now = new Date();
      const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

      // Run if more than 24 hours since last check
      return hoursSinceLastCheck >= 24;
    } catch (error) {
      console.error('[LowQuantityNotification] Error checking last run time:', error);
      return true; // Default to running if error
    }
  }

  /**
   * Mark that daily check has been run
   */
  async markDailyCheckComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
      console.log('[LowQuantityNotification] Daily check marked complete');
    } catch (error) {
      console.error('[LowQuantityNotification] Error marking daily check complete:', error);
    }
  }

  /**
   * Get the set of medication IDs that have been notified today
   */
  private async getNotifiedMedicationsToday(): Promise<Set<string>> {
    try {
      const dataStr = await AsyncStorage.getItem(NOTIFIED_MEDS_KEY);

      if (!dataStr) {
        return new Set();
      }

      const data = JSON.parse(dataStr);
      const today = new Date().toDateString();

      // Check if data is from today
      if (data.date === today) {
        return new Set(data.medicationIds);
      }

      // Data is from a previous day, clear it
      await AsyncStorage.removeItem(NOTIFIED_MEDS_KEY);
      return new Set();
    } catch (error) {
      console.error('[LowQuantityNotification] Error getting notified medications:', error);
      return new Set();
    }
  }

  /**
   * Mark a medication as notified for today
   */
  private async markMedicationAsNotified(medicationId: string): Promise<void> {
    try {
      const notifiedMeds = await this.getNotifiedMedicationsToday();
      notifiedMeds.add(medicationId);

      const data = {
        date: new Date().toDateString(),
        medicationIds: Array.from(notifiedMeds),
      };

      await AsyncStorage.setItem(NOTIFIED_MEDS_KEY, JSON.stringify(data));
      console.log('[LowQuantityNotification] Medication marked as notified:', medicationId);
    } catch (error) {
      console.error('[LowQuantityNotification] Error marking medication as notified:', error);
    }
  }

  /**
   * Clear all notification state (useful for testing)
   */
  async clearNotificationState(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([LAST_CHECK_KEY, NOTIFIED_MEDS_KEY]);
      console.log('[LowQuantityNotification] Notification state cleared');
    } catch (error) {
      console.error('[LowQuantityNotification] Error clearing notification state:', error);
    }
  }
}

// Export singleton instance
export const lowQuantityNotificationService = new LowQuantityNotificationService();
