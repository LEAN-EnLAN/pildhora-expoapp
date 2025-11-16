import { useEffect, useState, useCallback } from 'react';
import { onSnapshot, getDocs, Query, QuerySnapshot } from 'firebase/firestore';
import { getCache, setCache } from '../utils/cache';

type Source = 'static' | 'cache' | 'firestore';

interface UseCollectionSWROptions<T> {
  cacheKey: string | null;
  query: Query | null;
  initialData?: T[];
  /**
   * Enable real-time updates via onSnapshot
   * @default true
   */
  realtime?: boolean;
  /**
   * Cache time-to-live in milliseconds
   * @default undefined (no expiration)
   */
  cacheTTL?: number;
  /**
   * Callback when data is fetched from Firestore
   */
  onSuccess?: (data: T[]) => void;
  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;
}

interface UseCollectionSWRResult<T> {
  data: T[];
  source: Source;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching Firestore collections with SWR pattern
 * 
 * Features:
 * - Stale-While-Revalidate pattern for optimal UX
 * - Static initial data for instant rendering
 * - Cache layer with AsyncStorage
 * - Real-time updates via onSnapshot (optional)
 * - Pagination support via query limits
 * - Cache TTL support
 * - Error handling with retry capability
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, mutate } = useCollectionSWR({
 *   cacheKey: 'tasks:userId',
 *   query: tasksQuery,
 *   initialData: STATIC_TASKS,
 *   realtime: true,
 *   cacheTTL: 5 * 60 * 1000, // 5 minutes
 * });
 * ```
 */
export function useCollectionSWR<T>({
  cacheKey,
  query,
  initialData,
  realtime = true,
  cacheTTL,
  onSuccess,
  onError,
}: UseCollectionSWROptions<T>): UseCollectionSWRResult<T> {
  const [data, setData] = useState<T[]>(initialData ?? []);
  const [source, setSource] = useState<Source>(initialData ? 'static' : 'cache');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [refreshToggle, setRefreshToggle] = useState(false);

  /**
   * Trigger a manual refetch
   */
  const mutate = useCallback(() => {
    setRefreshToggle(prev => !prev);
  }, []);

  /**
   * Check if cached data is still valid based on TTL
   */
  const isCacheValid = useCallback(async (key: string): Promise<boolean> => {
    if (!cacheTTL) return true; // No TTL means cache is always valid

    try {
      const cached = await getCache<{ timestamp: number; data: T[] }>(key);
      if (!cached) return false;

      const age = Date.now() - cached.timestamp;
      return age < cacheTTL;
    } catch {
      return false;
    }
  }, [cacheTTL]);

  /**
   * Fetch data from Firestore and update cache
   * Note: Not memoized with useCallback to avoid dependency issues
   */
  const fetchData = async () => {
    if (!query || !cacheKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Try to load from cache first for instant rendering
      const cached = await getCache<T[]>(cacheKey);
      const cacheValid = await isCacheValid(cacheKey);

      if (cached && cached.length > 0 && cacheValid) {
        setData(cached);
        setSource('cache');
        setLoading(false); // Show cached data immediately
        console.log(`[useCollectionSWR] Loaded ${cached.length} items from cache (${cacheKey})`);
      }

      // Step 2: Fetch fresh data from Firestore
      const snap = await getDocs(query);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];

      setData(docs);
      setSource('firestore');
      setLoading(false);

      // Step 3: Update cache with fresh data
      await setCache(cacheKey, docs);

      console.log(`[useCollectionSWR] Fetched ${docs.length} items from Firestore (${cacheKey})`);

      // Call success callback
      if (onSuccess) {
        onSuccess(docs);
      }
    } catch (e: any) {
      console.error(`[useCollectionSWR] Error fetching data (${cacheKey}):`, e);
      setError(e);
      setLoading(false);

      // Call error callback
      if (onError) {
        onError(e);
      }
    }
  };

  /**
   * Set up data fetching and optional real-time listener
   */
  useEffect(() => {
    if (!query || !cacheKey) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;
    let mounted = true;

    const setupDataFetching = async () => {
      // Initial fetch
      await fetchData();

      // Set up real-time listener if enabled
      if (realtime && mounted) {
        unsub = onSnapshot(
          query,
          (snapshot: QuerySnapshot) => {
            if (!mounted) return;

            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
            setData(docs);
            setSource('firestore');

            // Update cache in background
            setCache(cacheKey, docs).catch(err => {
              console.error(`[useCollectionSWR] Cache update error (${cacheKey}):`, err);
            });

            console.log(`[useCollectionSWR] Real-time update: ${docs.length} items (${cacheKey})`);

            // Call success callback
            if (onSuccess) {
              onSuccess(docs);
            }
          },
          (e) => {
            if (!mounted) return;

            console.error(`[useCollectionSWR] Snapshot error (${cacheKey}):`, e);
            setError(e as Error);

            // Call error callback
            if (onError) {
              onError(e as Error);
            }
          }
        );
      }
    };

    setupDataFetching();

    return () => {
      mounted = false;
      if (unsub) {
        unsub();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, query, realtime, refreshToggle]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    mutate();
  }, [mutate]);

  return { data, source, isLoading, error, mutate, refetch };
}