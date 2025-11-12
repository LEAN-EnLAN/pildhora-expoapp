import { useEffect, useState } from 'react';
import { onSnapshot, getDocs, Query, QuerySnapshot } from 'firebase/firestore';
import { getCache, setCache } from '../utils/cache';

type Source = 'static' | 'cache' | 'firestore';

export function useCollectionSWR<T>({
  cacheKey,
  query,
  initialData,
}: { cacheKey: string | null; query: Query | null; initialData?: T[] }) {
  const [data, setData] = useState<T[]>(initialData ?? []);
  const [source, setSource] = useState<Source>(initialData ? 'static' : 'cache');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [refreshToggle, setRefreshToggle] = useState(false);

  const mutate = () => {
    setRefreshToggle(prev => !prev);
  };

  useEffect(() => {
    if (!query || !cacheKey) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const cached = await getCache<T[]>(cacheKey);
        if (mounted && cached && (!initialData || cached.length)) {
          setData(cached);
          setSource(initialData ? 'static' : 'cache');
        }

        const snap = await getDocs(query);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
        if (mounted) {
          setData(docs);
          setSource('firestore');
          setCache(cacheKey, docs);
        }
      } catch (e: any) {
        setError(e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    unsub = onSnapshot(query, (snapshot: QuerySnapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[];
      if (mounted) {
        setData(docs);
        setSource('firestore');
        setCache(cacheKey, docs);
      }
    }, (e) => {
      setError(e);
    });

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [cacheKey, query, initialData, refreshToggle]);

  return { data, source, isLoading, error, mutate };
}