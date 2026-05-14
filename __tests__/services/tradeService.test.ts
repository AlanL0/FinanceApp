jest.mock('../../src/core/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from '../../src/core/api/supabase';
import { Trade } from '../../src/core/api/database.types';
import { getTradeCount, getTradeHistory } from '../../src/services/tradeService';
import {
  createQueryBuilderMock,
  mockSupabaseAuthUser,
  mockSupabaseFrom,
  mockSupabaseUnauthenticated,
} from '../../test-utils/mockSupabase';

const trades: Trade[] = [
  {
    id: 'trade-2',
    user_id: 'user-123',
    symbol: 'MSFT',
    side: 'sell',
    order_type: 'market',
    shares: 1,
    price: 420,
    total: 420,
    status: 'executed',
    executed_at: '2026-05-14T10:00:00Z',
  },
  {
    id: 'trade-1',
    user_id: 'user-123',
    symbol: 'AAPL',
    side: 'buy',
    order_type: 'market',
    shares: 2,
    price: 200,
    total: 400,
    status: 'executed',
    executed_at: '2026-05-13T10:00:00Z',
  },
];

describe('tradeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTradeHistory', () => {
    it('returns trades ordered by executed_at descending', async () => {
      mockSupabaseAuthUser();
      const builder = createQueryBuilderMock({
        order: jest.fn().mockResolvedValue({ data: trades, error: null }),
      });
      mockSupabaseFrom('trades', builder);

      await expect(getTradeHistory()).resolves.toEqual(trades);

      expect(supabase.from).toHaveBeenCalledWith('trades');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(builder.order).toHaveBeenCalledWith('executed_at', { ascending: false });
    });

    it('filters by side when provided', async () => {
      mockSupabaseAuthUser();
      const buyTrades = trades.filter((trade) => trade.side === 'buy');
      const builder = createQueryBuilderMock({
        order: jest.fn().mockResolvedValue({ data: buyTrades, error: null }),
      });
      mockSupabaseFrom('trades', builder);

      await expect(getTradeHistory('buy')).resolves.toEqual(buyTrades);

      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(builder.eq).toHaveBeenCalledWith('side', 'buy');
      expect(builder.order).toHaveBeenCalledWith('executed_at', { ascending: false });
    });

    it('requires authentication', async () => {
      mockSupabaseUnauthenticated();

      await expect(getTradeHistory()).rejects.toThrow('User is not authenticated');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('throws a readable error when Supabase returns an error', async () => {
      mockSupabaseAuthUser();
      const builder = createQueryBuilderMock({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'database is unavailable' },
        }),
      });
      mockSupabaseFrom('trades', builder);

      await expect(getTradeHistory()).rejects.toThrow(
        'Unable to load trade history: database is unavailable',
      );
    });
  });

  describe('getTradeCount', () => {
    it('returns integer count using Supabase head count mode', async () => {
      mockSupabaseAuthUser();
      const builder = createQueryBuilderMock({
        eq: jest.fn().mockResolvedValue({ count: 7, error: null }),
      });
      mockSupabaseFrom('trades', builder);

      await expect(getTradeCount()).resolves.toBe(7);

      expect(supabase.from).toHaveBeenCalledWith('trades');
      expect(builder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('requires authentication', async () => {
      mockSupabaseUnauthenticated();

      await expect(getTradeCount()).rejects.toThrow('User is not authenticated');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('throws a readable error when Supabase returns an error', async () => {
      mockSupabaseAuthUser();
      const builder = createQueryBuilderMock({
        eq: jest.fn().mockResolvedValue({
          count: null,
          error: { message: 'count failed' },
        }),
      });
      mockSupabaseFrom('trades', builder);

      await expect(getTradeCount()).rejects.toThrow('Unable to load trade count: count failed');
    });
  });
});
