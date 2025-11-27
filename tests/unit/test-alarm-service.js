/**
 * Test script for AlarmService
 * 
 * This script tests the alarm service functionality including:
 * - Permission checking
 * - Alarm creation
 * - Alarm updates
 * - Alarm deletion
 * - Utility functions
 */

const { alarmService } = require('./src/services/alarmService');
const { 
  frequencyToDays, 
  daysToFrequency, 
  medicationToAlarmConfigs,
  isValidTimeFormat,
  formatTo24Hour,
  formatTo12Hour,
  getNextAlarmTime,
  hasAlarmsToday,
  getAlarmTimesForToday
} = require('./src/utils/alarmUtils');

console.log('=== Alarm Service Test ===\n');

// Test 1: Utility Functions
console.log('Test 1: Utility Functions');
console.log('-------------------------');

// Test frequency conversion
console.log('frequencyToDays("Daily"):', frequencyToDays('Daily'));
console.log('frequencyToDays("Weekdays"):', frequencyToDays('Weekdays'));
console.log('frequencyToDays("Mon,Wed,Fri"):', frequencyToDays('Mon,Wed,Fri'));
console.log('daysToFrequency([0,1,2,3,4,5,6]):', daysToFrequency([0,1,2,3,4,5,6]));
console.log('daysToFrequency([1,2,3,4,5]):', daysToFrequency([1,2,3,4,5]));

// Test time format validation
console.log('\nTime Format Validation:');
console.log('isValidTimeFormat("09:30"):', isValidTimeFormat('09:30'));
console.log('isValidTimeFormat("23:59"):', isValidTimeFormat('23:59'));
console.log('isValidTimeFormat("25:00"):', isValidTimeFormat('25:00'));
console.log('isValidTimeFormat("9:30"):', isValidTimeFormat('9:30'));

// Test time format conversion
console.log('\nTime Format Conversion:');
try {
  console.log('formatTo24Hour("9:30 AM"):', formatTo24Hour('9:30 AM'));
  console.log('formatTo24Hour("2:45 PM"):', formatTo24Hour('2:45 PM'));
  console.log('formatTo12Hour("09:30"):', formatTo12Hour('09:30'));
  console.log('formatTo12Hour("14:45"):', formatTo12Hour('14:45'));
} catch (error) {
  console.error('Time conversion error:', error.message);
}

// Test 2: Medication to Alarm Config Conversion
console.log('\n\nTest 2: Medication to Alarm Config Conversion');
console.log('----------------------------------------------');

const testMedication = {
  id: 'med_123',
  name: 'Aspirin',
  emoji: '💊',
  times: ['08:00', '14:00', '20:00'],
  frequency: 'Daily',
  doseValue: '500',
  doseUnit: 'mg',
  quantityType: 'tablets',
  patientId: 'patient_456',
  caregiverId: 'caregiver_789',
  trackInventory: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const alarmConfigs = medicationToAlarmConfigs(testMedication);
console.log('Alarm configs for medication:', JSON.stringify(alarmConfigs, null, 2));

// Test 3: Today's Alarms
console.log('\n\nTest 3: Today\'s Alarms');
console.log('----------------------');

console.log('hasAlarmsToday(testMedication):', hasAlarmsToday(testMedication));
console.log('getAlarmTimesForToday(testMedication):', getAlarmTimesForToday(testMedication));

const nextAlarm = getNextAlarmTime(testMedication);
console.log('getNextAlarmTime(testMedication):', nextAlarm ? nextAlarm.toLocaleString() : 'null');

// Test 4: Permission Status
console.log('\n\nTest 4: Permission Status');
console.log('-------------------------');
console.log('Current permission status:', alarmService.getPermissionStatus());

console.log('\n=== Test Complete ===');
console.log('\nNote: To test actual alarm creation, update, and deletion,');
console.log('you need to run this in a React Native environment with proper permissions.');
console.log('\nThe AlarmService provides the following methods:');
console.log('- canScheduleAlarms(): Check if alarms can be scheduled');
console.log('- requestPermissions(): Request notification permissions');
console.log('- createAlarm(config): Create a new alarm');
console.log('- updateAlarm(medicationId, config): Update an existing alarm');
console.log('- deleteAlarm(medicationId): Delete an alarm');
console.log('- getAlarmsForMedication(medicationId): Get alarm IDs for a medication');
console.log('- getAllScheduledNotifications(): Get all scheduled notifications');
console.log('- cancelAllAlarms(): Cancel all alarms');
