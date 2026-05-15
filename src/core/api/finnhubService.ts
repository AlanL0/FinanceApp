import axios from 'axios';
import { FINNHUB_API_KEY } from '@env';
import {
  createFinnhubCacheKey,
  getFinnhubCache,
  getFinnhubStaleCache,
  getFinnhubTtl,
  setFinnhubCache,
} from './finnhubCache';
import { assertFinnhubRateLimit, FinnhubRateLimitError } from './rateLimiter';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = FINNHUB_API_KEY || '';

export interface Quote {
  currentPrice: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePercent: number;
  isStale?: boolean;
  fetchedAt?: number;
  source?: 'network' | 'cache' | 'fallback';
}

export interface SearchResult {
  symbol: string;
  description: string;
  type: string;
}

interface FinnhubQuoteResponse {
  c?: number;
  o?: number;
  h?: number;
  l?: number;
  pc?: number;
  d?: number;
  dp?: number;
}

interface FinnhubSearchItem {
  symbol?: string;
  description?: string;
  type?: string;
}

interface FinnhubSearchResponse {
  result?: FinnhubSearchItem[];
}

interface AxiosStatusError {
  response?: {
    status?: number;
  };
  message?: string;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function markCachedQuote(quote: Quote, isStale = false): Quote {
  return {
    ...quote,
    isStale,
    source: 'cache',
  };
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof FinnhubRateLimitError) {
    return true;
  }

  return (error as AxiosStatusError).response?.status === 429;
}

function getReadableError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return 'Unknown Finnhub error';
}

function normalizeQuote(data: FinnhubQuoteResponse): Quote {
  const currentPrice = data.c ?? 0;
  const open = data.o ?? 0;
  const high = data.h ?? 0;
  const low = data.l ?? 0;
  const previousClose = data.pc ?? 0;

  if (currentPrice === 0 && open === 0 && previousClose === 0) {
    throw new Error('Invalid symbol');
  }

  if (currentPrice === 0 && previousClose > 0) {
    return {
      currentPrice: previousClose,
      open: open || previousClose,
      high: high || previousClose,
      low: low || previousClose,
      previousClose,
      change: 0,
      changePercent: 0,
      fetchedAt: Date.now(),
      source: 'fallback',
    };
  }

  return {
    currentPrice,
    open,
    high,
    low,
    previousClose,
    change: data.d ?? currentPrice - previousClose,
    changePercent: data.dp ?? 0,
    fetchedAt: Date.now(),
    source: 'network',
  };
}

function normalizeSearchResults(data: FinnhubSearchResponse): SearchResult[] {
  return (data.result ?? [])
    .filter((item): item is FinnhubSearchItem & { symbol: string } => Boolean(item.symbol))
    .map((item) => ({
      symbol: item.symbol,
      description: item.description ?? '',
      type: item.type ?? '',
    }));
}

export const FinnhubService = {
  async getQuote(symbol: string): Promise<Quote> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const cacheKey = createFinnhubCacheKey('quote', normalizedSymbol);
    const cachedQuote = getFinnhubCache<Quote>(cacheKey);

    if (cachedQuote) {
      return markCachedQuote(cachedQuote);
    }

    try {
      assertFinnhubRateLimit();
      const { data } = await axios.get<FinnhubQuoteResponse>(`${FINNHUB_BASE_URL}/quote`, {
        params: { symbol: normalizedSymbol, token: API_KEY },
      });
      const quote = normalizeQuote(data);
      setFinnhubCache(cacheKey, quote, getFinnhubTtl('quote'));
      return quote;
    } catch (error) {
      if (isRateLimitError(error)) {
        const staleQuote = getFinnhubStaleCache<Quote>(cacheKey);

        if (staleQuote) {
          return markCachedQuote(staleQuote, true);
        }

        throw new FinnhubRateLimitError('Finnhub rate limit exceeded and no cached quote is available');
      }

      throw new Error(`Unable to load quote: ${getReadableError(error)}`);
    }
  },

  async searchSymbol(query: string): Promise<SearchResult[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    const cacheKey = createFinnhubCacheKey('search', trimmedQuery);
    const cachedResults = getFinnhubCache<SearchResult[]>(cacheKey);

    if (cachedResults) {
      return cachedResults;
    }

    try {
      assertFinnhubRateLimit();
      const { data } = await axios.get<FinnhubSearchResponse>(`${FINNHUB_BASE_URL}/search`, {
        params: { q: trimmedQuery, token: API_KEY },
      });
      const results = normalizeSearchResults(data);
      setFinnhubCache(cacheKey, results, getFinnhubTtl('search'));
      return results;
    } catch (error) {
      if (isRateLimitError(error)) {
        const staleResults = getFinnhubStaleCache<SearchResult[]>(cacheKey);

        if (staleResults) {
          return staleResults;
        }

        throw new FinnhubRateLimitError('Finnhub rate limit exceeded and no cached search results are available');
      }

      throw new Error(`Unable to search symbols: ${getReadableError(error)}`);
    }
  },
};
