/**
 * Patient Data Cache Service
 * 
 * Caches patient data for offline viewing
 * Provides fallback data when network is unavailable
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatientWithDevice, MedicationEvent, Medication } from '../types';

// Cache keys
const CACHE_PREFIX = '@patient_cache_';
const CACHE_METADATA_KEY = '@patient_cache_metadata';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHED_PATIENTS = 10;

// Cache metadata interface
interface CacheMetadata {
  patientId: string;
  lastUpdated: string;
  dataTypes: string[];
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: string;
}

/**
 * Patient Data Cache Service
 */
export class PatientDataCacheService {
  /**
   * Get cache key for a specific data type
   */
  private getCacheKey(patientId: string, dataType: string): string {
    return `${CACHE_PREFIX}${patientId}_${dataType}`;
  }

  /**
   * Get cache metadata
   */
  private async getCacheMetadata(): Promise<CacheMetadata[]> {
    try {
      const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      return metadataJson ? JSON.parse(metadataJson) : [];
    } catch (error) {
      console.error('[PatientDataCache] Error getting metadata:', error);
      return [];
    }
  }

  /**
   * Update cache metadata
   */
  private async updateCacheMetadata(
    patientId: string,
    dataType: string
  ): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      const existingIndex = metadata.findIndex(m => m.patientId === patientId);

      if (existingIndex >= 0) {
        // Update existing entry
        const existing = metadata[existingIndex];
        existing.lastUpdated = new Date().toISOString();
        if (!existing.dataTypes.includes(dataType)) {
          existing.dataTypes.push(dataType);
        }
      } else {
        // Add new entry
        metadata.push({
          patientId,
          lastUpdated: new Date().toISOString(),
          dataTypes: [dataType],
        });
      }

      // Keep only the most recent entries
      const sorted = metadata.sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      const trimmed = sorted.slice(0, MAX_CACHED_PATIENTS);

      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('[PatientDataCache] Error updating metadata:', error);
    }
  }

  /**
   * Cache patient data
   */
  async cachePatientData(
    patientId: string,
    dataType: 'patient' | 'medications' | 'events' | 'deviceState',
    data: any
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(patientId, dataType);
      const entry: CacheEntry<any> = {
        data,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      await this.updateCacheMetadata(patientId, dataType);

      console.log('[PatientDataCache] Cached data:', {
        patientId,
        dataType,
        size: JSON.stringify(data).length,
      });
    } catch (error) {
      console.error('[PatientDataCache] Error caching data:', error);
    }
  }

  /**
   * Get cached patient data
   */
  async getCachedPatientData<T>(
    patientId: string,
    dataType: 'patient' | 'medications' | 'events' | 'deviceState',
    maxAgeMs: number = MAX_CACHE_AGE_MS
  ): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(patientId, dataType);
      const entryJson = await AsyncStorage.getItem(cacheKey);

      if (!entryJson) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(entryJson);
      const age = Date.now() - new Date(entry.timestamp).getTime();

      // Check if cache is still valid
      if (age > maxAgeMs) {
        console.log('[PatientDataCache] Cache expired:', {
          patientId,
          dataType,
          age: Math.round(age / 1000 / 60),
          maxAge: Math.round(maxAgeMs / 1000 / 60),
        });
        return null;
      }

      console.log('[PatientDataCache] Retrieved cached data:', {
        patientId,
        dataType,
        age: Math.round(age / 1000),
      });

      return entry.data;
    } catch (error) {
      console.error('[PatientDataCache] Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Cache patient profile
   */
  async cachePatient(patient: PatientWithDevice): Promise<void> {
    await this.cachePatientData(patient.id, 'patient', patient);
  }

  /**
   * Get cached patient profile
   */
  async getCachedPatient(patientId: string): Promise<PatientWithDevice | null> {
    return this.getCachedPatientData<PatientWithDevice>(patientId, 'patient');
  }

  /**
   * Cache patient medications
   */
  async cacheMedications(patientId: string, medications: Medication[]): Promise<void> {
    await this.cachePatientData(patientId, 'medications', medications);
  }

  /**
   * Get cached medications
   */
  async getCachedMedications(patientId: string): Promise<Medication[] | null> {
    return this.getCachedPatientData<Medication[]>(patientId, 'medications');
  }

  /**
   * Cache medication events
   */
  async cacheEvents(patientId: string, events: MedicationEvent[]): Promise<void> {
    await this.cachePatientData(patientId, 'events', events);
  }

  /**
   * Get cached events
   */
  async getCachedEvents(patientId: string): Promise<MedicationEvent[] | null> {
    return this.getCachedPatientData<MedicationEvent[]>(patientId, 'events');
  }

  /**
   * Cache device state
   */
  async cacheDeviceState(patientId: string, deviceState: any): Promise<void> {
    await this.cachePatientData(patientId, 'deviceState', deviceState);
  }

  /**
   * Get cached device state
   */
  async getCachedDeviceState(patientId: string): Promise<any | null> {
    return this.getCachedPatientData(patientId, 'deviceState');
  }

  /**
   * Clear cache for a specific patient
   */
  async clearPatientCache(patientId: string): Promise<void> {
    try {
      const dataTypes = ['patient', 'medications', 'events', 'deviceState'];
      const keys = dataTypes.map(type => this.getCacheKey(patientId, type));

      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));

      // Update metadata
      const metadata = await this.getCacheMetadata();
      const filtered = metadata.filter(m => m.patientId !== patientId);
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(filtered));

      console.log('[PatientDataCache] Cleared cache for patient:', patientId);
    } catch (error) {
      console.error('[PatientDataCache] Error clearing patient cache:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      const keys = metadata.flatMap(m =>
        m.dataTypes.map(type => this.getCacheKey(m.patientId, type))
      );

      await Promise.all([
        ...keys.map(key => AsyncStorage.removeItem(key)),
        AsyncStorage.removeItem(CACHE_METADATA_KEY),
      ]);

      console.log('[PatientDataCache] Cleared all cache');
    } catch (error) {
      console.error('[PatientDataCache] Error clearing all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalPatients: number;
    totalSize: number;
    oldestCache: string | null;
    newestCache: string | null;
  }> {
    try {
      const metadata = await this.getCacheMetadata();
      
      if (metadata.length === 0) {
        return {
          totalPatients: 0,
          totalSize: 0,
          oldestCache: null,
          newestCache: null,
        };
      }

      // Calculate total size
      let totalSize = 0;
      for (const meta of metadata) {
        for (const dataType of meta.dataTypes) {
          const key = this.getCacheKey(meta.patientId, dataType);
          const data = await AsyncStorage.getItem(key);
          if (data) {
            totalSize += data.length;
          }
        }
      }

      // Find oldest and newest
      const sorted = metadata.sort(
        (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
      );

      return {
        totalPatients: metadata.length,
        totalSize,
        oldestCache: sorted[0]?.lastUpdated || null,
        newestCache: sorted[sorted.length - 1]?.lastUpdated || null,
      };
    } catch (error) {
      console.error('[PatientDataCache] Error getting cache stats:', error);
      return {
        totalPatients: 0,
        totalSize: 0,
        oldestCache: null,
        newestCache: null,
      };
    }
  }

  /**
   * Prune old cache entries
   */
  async pruneOldCache(): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      const now = Date.now();

      for (const meta of metadata) {
        const age = now - new Date(meta.lastUpdated).getTime();
        if (age > MAX_CACHE_AGE_MS) {
          await this.clearPatientCache(meta.patientId);
          console.log('[PatientDataCache] Pruned old cache for patient:', meta.patientId);
        }
      }
    } catch (error) {
      console.error('[PatientDataCache] Error pruning cache:', error);
    }
  }
}

// Export singleton instance
export const patientDataCache = new PatientDataCacheService();
