import { FinnhubService } from '../../../src/core/api/finnhubService';

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FinnhubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getQuote', () => {
    it('should return formatted quote data for a valid symbol', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { c: 185.50, o: 183.20, h: 186.00, l: 182.50, pc: 184.00, d: 1.50, dp: 0.82 }
      });

      const quote = await FinnhubService.getQuote('AAPL');

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
      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe('AAPL');
    });
  });
});
