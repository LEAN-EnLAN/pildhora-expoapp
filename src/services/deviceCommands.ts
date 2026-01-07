/**
 * Device Commands Service
 * 
 * Sends commands to ESP8266 smart pillbox devices via Firebase RTDB.
 * The device polls these commands and executes them.
 * 
 * Commands available:
 * - topo: Trigger medication dispensing sequence
 * - buzzer: Activate buzzer alarm
 * - led: Control LED state
 * - ledColor: Set LED color (RGB)
 * - reboot: Reboot device
 */

import { getDeviceRdbInstance, getAuthInstance } from './firebase';
import { ref, get, update, set } from 'firebase/database';

export interface DeviceCommand {
  topo?: boolean;
  buzzer?: boolean;
  led?: boolean;
  ledColor?: string; // Format: "R,G,B" e.g., "255,0,0"
  reboot?: boolean;
}

export class DeviceCommandError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'DeviceCommandError';
  }
}

async function validateAuth(): Promise<string> {
  const auth = await getAuthInstance();
  if (!auth?.currentUser) {
    throw new DeviceCommandError(
      'User not authenticated',
      'NOT_AUTHENTICATED',
      'Debes iniciar sesión para enviar comandos al dispositivo.'
    );
  }
  return auth.currentUser.uid;
}

/**
 * Send a command to a device via Cloud Functions
 * @param deviceId - The device ID
 * @param command - The command to send
 */
export async function sendDeviceCommand(
  deviceId: string,
  command: Partial<DeviceCommand>
): Promise<void> {
  console.log('[DeviceCommands] Sending command to device:', deviceId, command);
  
  try {
    await validateAuth();
    const rdb = await getDeviceRdbInstance();
    if (!rdb) {
      throw new DeviceCommandError('RTDB not initialized', 'RTDB_NOT_INITIALIZED', 'Error de conexión.');
    }
    const commandsRef = ref(rdb, `devices/${deviceId}/commands`);
    try {
      await update(commandsRef, command as any);
    } catch {
      await set(commandsRef, command as any);
    }
    console.log('[DeviceCommands] Command sent successfully');
  } catch (error: any) {
    console.error('[DeviceCommands] Error sending command:', error);
    if (error instanceof DeviceCommandError) throw error;
    
    throw new DeviceCommandError(
      error.message,
      error.code || 'UNKNOWN_ERROR',
      'Error al enviar comando al dispositivo.'
    );
  }
}

/**
 * Trigger the TOPO (medication dispensing) sequence
 * @param deviceId - The device ID
 */
export async function triggerTopo(deviceId: string): Promise<void> {
  console.log('[DeviceCommands] Triggering TOPO for device:', deviceId);
  await sendDeviceCommand(deviceId, { topo: true });
}

/**
 * Trigger the buzzer alarm
 * @param deviceId - The device ID
 * @param enabled - Whether to enable or disable the buzzer
 */
export async function triggerBuzzer(deviceId: string, enabled: boolean = true): Promise<void> {
  console.log('[DeviceCommands] Triggering buzzer for device:', deviceId, enabled);
  await sendDeviceCommand(deviceId, { buzzer: enabled });
}


/**
 * Control the LED state
 * @param deviceId - The device ID
 * @param enabled - Whether to enable or disable the LED
 */
export async function setLedState(deviceId: string, enabled: boolean): Promise<void> {
  console.log('[DeviceCommands] Setting LED state for device:', deviceId, enabled);
  await sendDeviceCommand(deviceId, { led: enabled });
}

/**
 * Set the LED color
 * @param deviceId - The device ID
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 */
export async function setLedColor(
  deviceId: string,
  r: number,
  g: number,
  b: number
): Promise<void> {
  console.log('[DeviceCommands] Setting LED color for device:', deviceId, { r, g, b });
  const colorString = `${r},${g},${b}`;
  await sendDeviceCommand(deviceId, { ledColor: colorString, led: true });
}

/**
 * Reboot the device
 * @param deviceId - The device ID
 */
export async function rebootDevice(deviceId: string): Promise<void> {
  console.log('[DeviceCommands] Rebooting device:', deviceId);
  await sendDeviceCommand(deviceId, { reboot: true });
}

/**
 * Get current command state from device
 * @param deviceId - The device ID
 */
export async function getDeviceCommands(deviceId: string): Promise<DeviceCommand | null> {
  try {
    await validateAuth();
    
    const rdb = await getDeviceRdbInstance();
    if (!rdb) return null;
    
    const commandsRef = ref(rdb, `devices/${deviceId}/commands`);
    const snapshot = await get(commandsRef);
    
    if (!snapshot.exists()) return null;
    return snapshot.val() as DeviceCommand;
  } catch (error) {
    console.error('[DeviceCommands] Error getting commands:', error);
    return null;
  }
}

/**
 * Reset all commands to false (clear pending commands)
 * @param deviceId - The device ID
 */
export async function clearDeviceCommands(deviceId: string): Promise<void> {
  console.log('[DeviceCommands] Clearing commands for device:', deviceId);
  await sendDeviceCommand(deviceId, {
    topo: false,
    buzzer: false,
    led: false,
    ledColor: undefined,
    reboot: false
  });
}
