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
    it('should return matching US common stock symbols', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { result: [
          { symbol: 'AAPL', description: 'Apple Inc', type: 'Common Stock' },
          { symbol: 'AAPD', description: 'Direxion Apl Bear', type: 'ETP' },
          { symbol: 'AAPL.SW', description: 'Apple Inc Swiss listing', type: 'Common Stock' },
          { symbol: 'EURUSD', description: 'Euro US Dollar', type: 'Forex' },
        ]}
      });

      const results = await FinnhubService.searchSymbol('AAPL');
      expect(mockedAxios.get).toHaveBeenCalledWith('https://finnhub.io/api/v1/search', {
        params: { q: 'AAPL', token: 'test_mock_key' },
      });
      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('AAPL');
    });

    it('allows US share class stock symbols', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { result: [
          { symbol: 'brk.b', displaySymbol: 'BRK.B', description: 'Berkshire Hathaway Inc', type: 'Common Stock' },
          { symbol: 'BRK.BE', displaySymbol: 'BRK.BE', description: 'Berkshire European listing', type: 'Common Stock' },
        ]}
      });

      const results = await FinnhubService.searchSymbol('brk');

      expect(results).toEqual([
        { symbol: 'BRK.B', description: 'Berkshire Hathaway Inc', type: 'Common Stock' },
      ]);
    });

    it('dedupes noisy company name variants and keeps the cleaner description', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { result: [
          { symbol: 'SNAP', description: 'SNAP INC - A', type: 'Common Stock' },
          { symbol: 'SNAP', description: 'Snap Inc', type: 'Common Stock' },
          { symbol: 'SNAP.W', description: 'Snap Inc Warrants', type: 'Common Stock' },
        ]}
      });

      const results = await FinnhubService.searchSymbol('snap');

      expect(results).toEqual([
        { symbol: 'SNAP', description: 'Snap Inc', type: 'Common Stock' },
        { symbol: 'SNAP.W', description: 'Snap Inc Warrants', type: 'Common Stock' },
      ]);
    });

    it('keeps valid fuzzy share-class symbols for the same company', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { result: [
          { symbol: 'GOOG', description: 'Alphabet Inc Class C', type: 'Common Stock' },
          { symbol: 'GOOGL', description: 'Alphabet Inc Class A', type: 'Common Stock' },
        ]}
      });

      const results = await FinnhubService.searchSymbol('goog');

      expect(results).toEqual([
        { symbol: 'GOOG', description: 'Alphabet Inc Class C', type: 'Common Stock' },
        { symbol: 'GOOGL', description: 'Alphabet Inc Class A', type: 'Common Stock' },
      ]);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('adds investable US stocks whose tickers contain the search query from the symbol directory', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { result: [
            { symbol: 'GOOG', description: 'Alphabet Inc Class C', type: 'Common Stock' },
          ]}
        })
        .mockResolvedValueOnce({
          data: [
            { symbol: 'GOOG', description: 'Alphabet Inc Class C', type: 'Common Stock' },
            { symbol: 'GOOGL', description: 'Alphabet Inc Class A', type: 'Common Stock' },
            { symbol: 'GOOS', description: 'Canada Goose Holdings Inc', type: 'Common Stock' },
            { symbol: 'GOOG.SW', description: 'Alphabet Swiss listing', type: 'Common Stock' },
            { symbol: 'GOOGU', description: 'Goog ETF', type: 'ETP' },
          ]
        });

      const results = await FinnhubService.searchSymbol('GOOG');

      expect(mockedAxios.get).toHaveBeenNthCalledWith(2, 'https://finnhub.io/api/v1/stock/symbol', {
        params: { exchange: 'US', token: 'test_mock_key' },
      });
      expect(results).toEqual([
        { symbol: 'GOOG', description: 'Alphabet Inc Class C', type: 'Common Stock' },
        { symbol: 'GOOGL', description: 'Alphabet Inc Class A', type: 'Common Stock' },
      ]);
    });

    it('reuses the cached US symbol directory across ticker searches', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { result: [] } })
        .mockResolvedValueOnce({
          data: [
            { symbol: 'GOOG', description: 'Alphabet Inc Class C', type: 'Common Stock' },
            { symbol: 'GOOGL', description: 'Alphabet Inc Class A', type: 'Common Stock' },
            { symbol: 'SNAP', description: 'Snap Inc', type: 'Common Stock' },
          ],
        })
        .mockResolvedValueOnce({ data: { result: [] } });

      await FinnhubService.searchSymbol('GOOG');
      const snapResults = await FinnhubService.searchSymbol('SNAP');

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(snapResults).toEqual([
        { symbol: 'SNAP', description: 'Snap Inc', type: 'Common Stock' },
      ]);
    });

    it('returns empty results for empty searches', async () => {
      const results = await FinnhubService.searchSymbol('   ');

      expect(results).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('getCompanyProfile', () => {
    it('returns normalized company profile data with logo', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          ticker: 'AAPL',
          name: 'Apple Inc',
          exchange: 'NASDAQ NMS - GLOBAL MARKET',
          finnhubIndustry: 'Technology',
          logo: 'https://static.finnhub.io/logo/aapl.png',
          weburl: 'https://www.apple.com/',
        },
      });

      const profile = await FinnhubService.getCompanyProfile(' aapl ');

      expect(mockedAxios.get).toHaveBeenCalledWith('https://finnhub.io/api/v1/stock/profile2', {
        params: { symbol: 'AAPL', token: 'test_mock_key' },
      });
      expect(profile).toEqual({
        symbol: 'AAPL',
        name: 'Apple Inc',
        exchange: 'NASDAQ NMS - GLOBAL MARKET',
        industry: 'Technology',
        logo: 'https://static.finnhub.io/logo/aapl.png',
        webUrl: 'https://www.apple.com/',
      });
    });

    it('returns fresh cached company profile without duplicate axios call', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          ticker: 'MSFT',
          name: 'Microsoft Corp',
          logo: 'https://static.finnhub.io/logo/msft.png',
        },
      });

      const firstProfile = await FinnhubService.getCompanyProfile('msft');
      const secondProfile = await FinnhubService.getCompanyProfile('MSFT');

      expect(firstProfile.name).toBe('Microsoft Corp');
      expect(secondProfile.logo).toBe('https://static.finnhub.io/logo/msft.png');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });
});
