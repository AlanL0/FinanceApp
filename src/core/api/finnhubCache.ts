export type FinnhubEndpoint = 'quote' | 'search';

export const FINNHUB_CACHE_TTL_MS: Record<FinnhubEndpoint, number> = {
  quote: 15_000,
  search: 300_000,
};

export const FINNHUB_STALE_TTL_MS = 30 * 60_000;

interface CacheEntry<T> {
  value: T;
  fetchedAt: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function createFinnhubCacheKey(endpoint: FinnhubEndpoint, value: string): string {
  return `${endpoint}:${value.trim().toUpperCase()}`;
}

export function getFinnhubTtl(endpoint: FinnhubEndpoint): number {
  return FINNHUB_CACHE_TTL_MS[endpoint];
}

export function setFinnhubCache<T>(
  key: string,
  value: T,
  ttlMs: number,
  now = Date.now(),
): void {
  cache.set(key, {
    value,
    fetchedAt: now,
    expiresAt: now + ttlMs,
  });
}

export function getFinnhubCache<T>(key: string, now = Date.now()): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry || entry.expiresAt <= now) {
    return null;
  }

  return entry.value;
}

export function getFinnhubStaleCache<T>(
  key: string,
  staleTtlMs = FINNHUB_STALE_TTL_MS,
  now = Date.now(),
): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry || entry.fetchedAt + staleTtlMs <= now) {
    return null;
  }

  return entry.value;
}

export function clearFinnhubCache(): void {
  cache.clear();
}
