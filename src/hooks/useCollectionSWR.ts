import { useEffect, useState } from 'react';
import { onSnapshot, getDocs, Query, QuerySnapshot } from 'firebase/firestore';
import { getCache, setCache } from '../utils/cache';

type Source = 'static' | 'cache' | 'firestore';

export function useCollectionSWR<T>({
  cacheKey,
  query,
  initialData,
}: { cacheKey: string; query: Query | null; initialData?: T[] }) {
  const [data, setData] = useState<T[]>(initialData ?? []);
  const [source, setSource] = useState<Source>(initialData ? 'static' : 'cache');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If query is null, don't fetch data
    if (!query) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;
    let mounted = true;

    (async () => {
      // Hydrate from cache
      const cached = await getCache<T[]>(cacheKey);
      if (mounted && cached && (!initialData || cached.length)) {
        setData(cached);
        setSource(initialData ? 'static' : 'cache');
        setLoading(false);
      }

      // Fast initial read
      try {
        const snap = await getDocs(query);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
        if (mounted) {
          setData(docs);
          setSource('firestore');
          setCache(cacheKey, docs);
          setLoading(false);
        }
      } catch (e: any) {
        setError(e);
      }

      // Live updates
      unsub = onSnapshot(query, (snapshot: QuerySnapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
        if (mounted) {
          setData(docs);
          setSource('firestore');
          setCache(cacheKey, docs);
        }
      }, (e) => setError(e));
    })();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [cacheKey, query]);

  return { data, source, isLoading, error };
}