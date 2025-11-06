import AsyncStorage from '@react-native-async-storage/async-storage';

type CachePayload<T> = { version: number; ts: number; data: T };

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const payload: CachePayload<T> = JSON.parse(raw);
    return payload.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T, version = 1): Promise<void> {
  const payload: CachePayload<T> = { version, ts: Date.now(), data };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}