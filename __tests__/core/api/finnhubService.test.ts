import { FinnhubService } from '../../../src/core/api/finnhubService';
import { clearFinnhubCache } from '../../../src/core/api/finnhubCache';
import { finnhubRateLimiter } from '../../../src/core/api/rateLimiter';

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FinnhubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFinnhubCache();
    finnhubRateLimiter.reset();
  });

  describe('getQuote', () => {
    it('should return formatted quote data for a valid symbol', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { c: 185.50, o: 183.20, h: 186.00, l: 182.50, pc: 184.00, d: 1.50, dp: 0.82 }
      });

      const quote = await FinnhubService.getQuote('AAPL');

      expect(mockedAxios.get).toHaveBeenCalledWith('https://finnhub.io/api/v1/quote', {
        params: { symbol: 'AAPL', token: 'test_mock_key' },
      });
      expect(quote.currentPrice).toBe(185.50);
      expect(quote.open).toBe(183.20);
      expect(quote.high).toBe(186.00);
      expect(quote.low).toBe(182.50);
      expect(quote.previousClose).toBe(184.00);
      expect(quote.change).toBe(1.50);
      expect(quote.changePercent).toBe(0.82);
    });

    it('should throw an error for an invalid symbol', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { c: 0, o: 0, h: 0, l: 0, pc: 0 }
      });

      await expect(FinnhubService.getQuote('XXXXX'))
        .rejects.toThrow('Invalid symbol');
    });

    it('returns fresh cached quote without duplicate axios call', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { c: 185.50, o: 183.20, h: 186.00, l: 182.50, pc: 184.00, d: 1.50, dp: 0.82 }
      });

      const firstQuote = await FinnhubService.getQuote(' aapl ');
      const secondQuote = await FinnhubService.getQuote('AAPL');

      expect(firstQuote.currentPrice).toBe(185.50);
      expect(secondQuote.currentPrice).toBe(185.50);
      expect(secondQuote.source).toBe('cache');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchSymbol', () => {
    it('should return matching symbols', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { result: [
          { symbol: 'AAPL', description: 'Apple Inc', type: 'Common Stock' },
          { symbol: 'AAPD', description: 'Direxion Apl Bear', type: 'ETP' },
        ]}
      });

      const results = await FinnhubService.searchSymbol('AAPL');
      expect(mockedAxios.get).toHaveBeenCalledWith('https://finnhub.io/api/v1/search', {
        params: { q: 'AAPL', token: 'test_mock_key' },
      });
      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe('AAPL');
    });

    it('returns empty results for empty searches', async () => {
      const results = await FinnhubService.searchSymbol('   ');

      expect(results).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });
});
