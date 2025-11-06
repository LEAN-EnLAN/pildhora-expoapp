import { Timestamp } from 'firebase/firestore';

/**
 * Converts Firestore Timestamps to ISO strings for Redux serialization
 * @param data - Object that may contain Firestore Timestamps
 * @returns New object with all Timestamps converted to ISO strings
 */
export const convertTimestamps = (data: any): any => {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item));
  }

  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const converted: any = {};
    
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        
        // Check if it's a Firestore Timestamp
        if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
          // Convert Firestore Timestamp to ISO string
          converted[key] = value.toDate().toISOString();
        } else {
          // Recursively convert nested objects
          converted[key] = convertTimestamps(value);
        }
      }
    }
    
    return converted;
  }

  // Return primitive values as-is
  return data;
};

/**
 * Converts ISO strings back to Date objects when needed
 * @param data - Object that may contain ISO string dates
 * @returns New object with ISO strings converted to Date objects
 */
export const convertISOStringsToDates = (data: any): any => {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertISOStringsToDates(item));
  }

  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const converted: any = {};
    
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        
        // Check if it's a date field (ends with 'At' or is 'createdAt', 'updatedAt', etc.)
        if (typeof value === 'string' && (
          key.endsWith('At') || 
          key === 'createdAt' || 
          key === 'updatedAt' || 
          key === 'dueDate' ||
          key === 'lastSeen' ||
          key === 'scheduledTime'
        )) {
          converted[key] = new Date(value);
        } else {
          // Recursively convert nested objects
          converted[key] = convertISOStringsToDates(value);
        }
      }
    }
    
    return converted;
  }

  // Return primitive values as-is
  return data;
};