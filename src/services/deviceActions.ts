import { getDeviceRdbInstance } from './firebase';
import { ref, get, push, set } from 'firebase/database';
import { triggerTopo, triggerBuzzer, clearDeviceCommands } from './deviceCommands';

/**
 * Device action types that can be triggered by caregivers
 */
export type DeviceActionType = 
  | 'test_alarm'
  | 'dispense_dose'
  | 'sync_time'
  | 'check_status'
  | 'clear_alarm';

/**
 * Device action result
 */
export interface DeviceActionResult {
  success: boolean;
  message: string;
  actionId?: string;
}

/**
 * Device action request stored in RTDB
 */
interface DeviceActionRequest {
  actionType: DeviceActionType;
  requestedBy: string;
  requestedAt: number;
  status: 'pending' | 'completed' | 'failed';
  completedAt?: number;
  error?: string;
}

/**
 * Service for triggering device actions from the caregiver app
 * 
 * This service allows caregivers to send commands to patient devices
 * through Cloud Functions.
 * 
 * Requirements: 8.4 - Enable device action triggers for caregivers
 */
export class DeviceActionsService {
  /**
   * Trigger a test alarm on the device (buzzer)
   * 
   * @param deviceId - Device identifier
   * @param userId - User ID triggering the action (caregiver)
   * @returns Action result
   */
  async triggerTestAlarm(deviceId: string, userId: string): Promise<DeviceActionResult> {
    try {
      console.log('[DeviceActionsService] Triggering test alarm (buzzer):', { deviceId, userId });
      await triggerBuzzer(deviceId, true);
      return {
        success: true,
        message: 'Alarma de prueba activada en el dispositivo',
      };
    } catch (error: any) {
      console.error('[DeviceActionsService] Error triggering test alarm:', error);
      return {
        success: false,
        message: error.userMessage || 'Error al activar la alarma de prueba',
      };
    }
  }

  /**
   * Trigger manual dose dispensing (TOPO sequence)
   * 
   * @param deviceId - Device identifier
   * @param userId - User ID triggering the action (caregiver)
   * @returns Action result
   */
  async dispenseManualDose(deviceId: string, userId: string): Promise<DeviceActionResult> {
    try {
      console.log('[DeviceActionsService] Creating dispense request:', { deviceId, userId });
      const rdb = await getDeviceRdbInstance();
      if (!rdb) return { success: false, message: 'RTDB no disponible' };
      const listRef = ref(rdb, `devices/${deviceId}/actions`);
      const newRef = push(listRef);
      const actionId = newRef.key as string;
      await set(newRef, {
        actionType: 'dispense_dose',
        requestedBy: userId,
        requestedAt: Date.now(),
        status: 'pending',
      });
      return { success: true, message: 'Solicitud de dispensación enviada', actionId };
    } catch (error: any) {
      console.error('[DeviceActionsService] Error creating dispense request:', error);
      return { success: false, message: error.message || 'Error al solicitar dispensación' };
    }
  }

  /**
   * Sync device time with server
   * 
   * @param deviceId - Device identifier
   * @param userId - User ID triggering the action (caregiver)
   * @returns Action result
   */
  async syncDeviceTime(deviceId: string, userId: string): Promise<DeviceActionResult> {
    return this.triggerAction(deviceId, 'sync_time', userId);
  }

  /**
   * Request device status update
   * 
   * @param deviceId - Device identifier
   * @param userId - User ID triggering the action (caregiver)
   * @returns Action result
   */
  async checkDeviceStatus(deviceId: string, userId: string): Promise<DeviceActionResult> {
    return this.triggerAction(deviceId, 'check_status', userId);
  }

  /**
   * Clear active alarm on device (reset all commands)
   * 
   * @param deviceId - Device identifier
   * @param userId - User ID triggering the action (caregiver)
   * @returns Action result
   */
  async clearAlarm(deviceId: string, userId: string): Promise<DeviceActionResult> {
    try {
      console.log('[DeviceActionsService] Clearing alarm (reset commands):', deviceId);
      await clearDeviceCommands(deviceId);
      return {
        success: true,
        message: 'Alarma silenciada correctamente',
      };
    } catch (error: any) {
      console.error('[DeviceActionsService] Error clearing alarm:', error);
      return {
        success: false,
        message: error.userMessage || 'Error al silenciar la alarma',
      };
    }
  }

  /**
   * Generic method to trigger any device action
   * 
   * @param deviceId - Device identifier
   * @param actionType - Type of action to trigger
   * @param userId - User ID triggering the action
   * @returns Action result
   */
  private async triggerAction(
    deviceId: string,
    actionType: DeviceActionType,
    userId: string
  ): Promise<DeviceActionResult> {
    try {
      console.log('[DeviceActionsService] Triggering action:', { deviceId, actionType, userId });
      const rdb = await getDeviceRdbInstance();
      if (!rdb) return { success: false, message: 'RTDB no disponible' };
      const listRef = ref(rdb, `devices/${deviceId}/actions`);
      const newRef = push(listRef);
      const actionId = newRef.key as string;
      await set(newRef, {
        actionType,
        requestedBy: userId,
        requestedAt: Date.now(),
        status: 'pending',
      });
      return { success: true, message: this.getSuccessMessage(actionType), actionId };
    } catch (error: any) {
      console.error('[DeviceActionsService] Error triggering action:', error);
      return {
        success: false,
        message: error.message || 'Failed to trigger device action',
      };
    }
  }

  /**
   * Get user-friendly success message for action type
   */
  private getSuccessMessage(actionType: DeviceActionType): string {
    switch (actionType) {
      case 'test_alarm':
        return 'Test alarm triggered successfully';
      case 'dispense_dose':
        return 'Manual dose dispensing initiated';
      case 'sync_time':
        return 'Device time sync requested';
      case 'check_status':
        return 'Device status update requested';
      case 'clear_alarm':
        return 'Alarm cleared successfully';
      default:
        return 'Action triggered successfully';
    }
  }

  /**
   * Get the status of a previously triggered action
   * 
   * @param deviceId - Device identifier
   * @param actionId - Action identifier
   * @returns Action request with current status
   */
  async getActionStatus(deviceId: string, actionId: string): Promise<DeviceActionRequest | null> {
    try {
      const rdb = await getDeviceRdbInstance();
      if (!rdb) {
        return null;
      }

      const actionRef = ref(rdb, `devices/${deviceId}/actions/${actionId}`);
      const snapshot = await get(actionRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val() as DeviceActionRequest;
    } catch (error) {
      console.error('[DeviceActionsService] Error getting action status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const deviceActionsService = new DeviceActionsService();
