import axios from 'axios';
import { FinnhubService } from '../../../src/core/api/finnhubService';
import { clearFinnhubCache } from '../../../src/core/api/finnhubCache';
import { finnhubRateLimiter, FinnhubRateLimitError } from '../../../src/core/api/rateLimiter';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FinnhubService error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFinnhubCache();
    finnhubRateLimiter.reset();
  });

  it('returns cached data on 429', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { c: 185.5, o: 183.2, h: 186, l: 182.5, pc: 184, d: 1.5, dp: 0.82 },
    });

    await FinnhubService.getQuote('AAPL');

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(Date.now() + 20_000);
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 429 }, message: 'Too many requests' });

    const quote = await FinnhubService.getQuote('AAPL');
    nowSpy.mockRestore();

    expect(quote.currentPrice).toBe(185.5);
    expect(quote.isStale).toBe(true);
    expect(quote.source).toBe('cache');
  });

  it('throws on 429 when no stale cache exists', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 429 }, message: 'Too many requests' });

    await expect(FinnhubService.getQuote('AAPL')).rejects.toThrow(FinnhubRateLimitError);
  });

  it('throws on network failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network down'));

    await expect(FinnhubService.getQuote('AAPL')).rejects.toThrow('Unable to load quote: Network down');
  });

  it('returns fallback on market closed partial quote', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { c: 0, o: 0, h: 0, l: 0, pc: 184 },
    });

    const quote = await FinnhubService.getQuote('AAPL');

    expect(quote.currentPrice).toBe(184);
    expect(quote.open).toBe(184);
    expect(quote.change).toBe(0);
    expect(quote.changePercent).toBe(0);
    expect(quote.source).toBe('fallback');
  });
});
