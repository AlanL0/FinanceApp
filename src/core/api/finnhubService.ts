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
const US_COMMON_STOCK_TYPE = 'common stock';
const US_STOCK_SYMBOL_PATTERN = /^[A-Z]{1,5}([.-][A-Z])?$/;
const SYMBOL_DIRECTORY_QUERY_PATTERN = /^[A-Z]{2,5}$/;

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

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  logo: string;
  webUrl: string;
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
  displaySymbol?: string;
  description?: string;
  type?: string;
}

interface FinnhubSearchResponse {
  result?: FinnhubSearchItem[];
}

interface FinnhubStockSymbolItem {
  symbol?: string;
  displaySymbol?: string;
  description?: string;
  type?: string;
}

interface FinnhubCompanyProfileResponse {
  ticker?: string;
  name?: string;
  exchange?: string;
  finnhubIndustry?: string;
  logo?: string;
  weburl?: string;
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
  const results = (data.result ?? [])
    .filter((item): item is FinnhubSearchItem & { symbol: string } => Boolean(item.symbol))
    .filter(isLikelyUsCommonStock)
    .map((item) => ({
      symbol: normalizeSymbol(item.symbol),
      description: item.description ?? '',
      type: item.type ?? '',
    }));

  return dedupeSearchResults(results);
}

function isLikelyUsCommonStock(item: FinnhubSearchItem & { symbol: string }): boolean {
  const symbol = normalizeSymbol(item.symbol);
  const displaySymbol = normalizeSymbol(item.displaySymbol ?? item.symbol);
  const type = item.type?.trim().toLowerCase() ?? '';

  return (
    type === US_COMMON_STOCK_TYPE &&
    US_STOCK_SYMBOL_PATTERN.test(symbol) &&
    US_STOCK_SYMBOL_PATTERN.test(displaySymbol)
  );
}

function normalizeCompanyProfile(
  data: FinnhubCompanyProfileResponse,
  fallbackSymbol: string,
): CompanyProfile {
  return {
    symbol: normalizeSymbol(data.ticker ?? fallbackSymbol),
    name: data.name ?? '',
    exchange: data.exchange ?? '',
    industry: data.finnhubIndustry ?? '',
    logo: data.logo ?? '',
    webUrl: data.weburl ?? '',
  };
}

function dedupeSearchResults(results: SearchResult[]): SearchResult[] {
  const dedupedResults = new Map<string, SearchResult>();

  results.forEach((result) => {
    const key = createSearchDedupeKey(result);
    const existingResult = dedupedResults.get(key);

    if (!existingResult || searchResultScore(result) > searchResultScore(existingResult)) {
      dedupedResults.set(key, result);
    }
  });

  return Array.from(dedupedResults.values());
}

function createSearchDedupeKey(result: SearchResult): string {
  const companyKey = normalizeCompanyDescription(result.description);

  return `${result.symbol}:${companyKey || result.symbol}`;
}

function normalizeCompanyDescription(description: string): string {
  return description
    .toUpperCase()
    .replace(/\b(CLASS|CL|COM|COMMON|ORDINARY|SHARES?|STOCK|THE)\b/g, ' ')
    .replace(/\s+-\s+[A-Z]$/g, ' ')
    .replace(/\s+[A-Z]$/g, ' ')
    .replace(/[^A-Z0-9]/g, ' ')
    .replace(/\b(INCORPORATED|INC|CORPORATION|CORP|COMPANY|CO|LTD|LIMITED|PLC|SA|NV|AG)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchResultScore(result: SearchResult): number {
  const description = result.description.trim();
  let score = 0;

  if (description) {
    score += 10;
  }

  if (description && !/\s+-\s+[A-Z]$/i.test(description)) {
    score += 5;
  }

  if (!/[.-]/.test(result.symbol)) {
    score += 2;
  }

  score -= Math.max(description.length - 24, 0) / 24;
  return score;
}

async function fetchFinnhubSearch(query: string): Promise<FinnhubSearchResponse> {
  assertFinnhubRateLimit();
  const { data } = await axios.get<FinnhubSearchResponse>(`${FINNHUB_BASE_URL}/search`, {
    params: { q: query, token: API_KEY },
  });
  return data;
}

async function fetchFinnhubUsSymbols(): Promise<FinnhubStockSymbolItem[]> {
  const cacheKey = createFinnhubCacheKey('symbols', 'US');
  const cachedSymbols = getFinnhubCache<FinnhubStockSymbolItem[]>(cacheKey);

  if (cachedSymbols) {
    return cachedSymbols;
  }

  assertFinnhubRateLimit();
  const { data } = await axios.get<FinnhubStockSymbolItem[]>(`${FINNHUB_BASE_URL}/stock/symbol`, {
    params: { exchange: 'US', token: API_KEY },
  });
  setFinnhubCache(cacheKey, data, getFinnhubTtl('symbols'));
  return data;
}

function shouldSearchUsSymbolDirectory(query: string, primaryResults: SearchResult[]): boolean {
  const normalizedQuery = normalizeSymbol(query);

  if (!SYMBOL_DIRECTORY_QUERY_PATTERN.test(normalizedQuery)) {
    return false;
  }

  return !primaryResults.some((result) => (
    result.symbol !== normalizedQuery && result.symbol.includes(normalizedQuery)
  ));
}

function filterSymbolDirectoryItems(query: string, items: FinnhubStockSymbolItem[]): FinnhubSearchItem[] {
  const normalizedQuery = normalizeSymbol(query);

  return items.filter((item) => (
    item.symbol ? normalizeSymbol(item.symbol).includes(normalizedQuery) : false
  ));
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
      const data = await fetchFinnhubSearch(trimmedQuery);
      const primaryResults = normalizeSearchResults(data);
      let combinedSearchItems = data.result ?? [];

      if (shouldSearchUsSymbolDirectory(trimmedQuery, primaryResults)) {
        try {
          const directoryItems = await fetchFinnhubUsSymbols();
          combinedSearchItems = [
            ...combinedSearchItems,
            ...filterSymbolDirectoryItems(trimmedQuery, directoryItems),
          ];
        } catch {
          combinedSearchItems = data.result ?? [];
        }
      }

      const results = normalizeSearchResults({ result: combinedSearchItems });
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

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const cacheKey = createFinnhubCacheKey('profile', normalizedSymbol);
    const cachedProfile = getFinnhubCache<CompanyProfile>(cacheKey);

    if (cachedProfile) {
      return cachedProfile;
    }

    try {
      assertFinnhubRateLimit();
      const { data } = await axios.get<FinnhubCompanyProfileResponse>(`${FINNHUB_BASE_URL}/stock/profile2`, {
        params: { symbol: normalizedSymbol, token: API_KEY },
      });
      const profile = normalizeCompanyProfile(data, normalizedSymbol);
      setFinnhubCache(cacheKey, profile, getFinnhubTtl('profile'));
      return profile;
    } catch (error) {
      if (isRateLimitError(error)) {
        const staleProfile = getFinnhubStaleCache<CompanyProfile>(cacheKey);

        if (staleProfile) {
          return staleProfile;
        }

        throw new FinnhubRateLimitError('Finnhub rate limit exceeded and no cached company profile is available');
      }

      throw new Error(`Unable to load company profile: ${getReadableError(error)}`);
    }
  },
};
