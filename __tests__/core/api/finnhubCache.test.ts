import {
  clearFinnhubCache,
  createFinnhubCacheKey,
  getFinnhubCache,
  getFinnhubTtl,
  setFinnhubCache,
} from '../../../src/core/api/finnhubCache';

describe('finnhubCache', () => {
  beforeEach(() => {
    clearFinnhubCache();
  });

  it('returns cached data within TTL', () => {
    const key = createFinnhubCacheKey('quote', 'aapl');
    setFinnhubCache(key, { price: 185 }, getFinnhubTtl('quote'), 1_000);

    expect(getFinnhubCache(key, 10_000)).toEqual({ price: 185 });
  });

  it('expires cached data after TTL', () => {
    const key = createFinnhubCacheKey('quote', 'AAPL');
    setFinnhubCache(key, { price: 185 }, getFinnhubTtl('quote'), 1_000);

    expect(getFinnhubCache(key, 16_000)).toBeNull();
  });

  it('uses different TTLs for different endpoints', () => {
    expect(getFinnhubTtl('quote')).toBe(15_000);
    expect(getFinnhubTtl('search')).toBe(300_000);
  });
});
