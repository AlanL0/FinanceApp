import { supabase } from '../../src/core/api/supabase';
import { addSymbol, getWatchlist, removeSymbol } from '../../src/services/watchlistService';
import {
  createQueryBuilderMock,
  mockSupabaseAuthUser,
  mockSupabaseFrom,
  mockSupabaseUnauthenticated,
} from '../../test-utils/mockSupabase';

jest.mock('../../src/core/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('watchlistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getWatchlist returns array ordered by added_at ascending', async () => {
    const watchlistItems = [
      { id: 'watch-1', user_id: 'user-123', symbol: 'AAPL', added_at: '2026-01-01T00:00:00Z' },
      { id: 'watch-2', user_id: 'user-123', symbol: 'MSFT', added_at: '2026-01-02T00:00:00Z' },
    ];
    const builder = createQueryBuilderMock({
      order: jest.fn().mockResolvedValue({ data: watchlistItems, error: null }),
    });

    mockSupabaseAuthUser('user-123');
    mockSupabaseFrom('watchlist', builder);

    await expect(getWatchlist()).resolves.toEqual(watchlistItems);
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(builder.order).toHaveBeenCalledWith('added_at', { ascending: true });
  });

  it('getWatchlist requires authentication', async () => {
    mockSupabaseUnauthenticated();

    await expect(getWatchlist()).rejects.toThrow('User is not authenticated');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('addSymbol inserts normalized symbol and returns item', async () => {
    const insertedItem = {
      id: 'watch-1',
      user_id: 'user-123',
      symbol: 'AAPL',
      added_at: '2026-01-01T00:00:00Z',
    };
    const builder = createQueryBuilderMock({
      single: jest.fn().mockResolvedValue({ data: insertedItem, error: null }),
    });

    mockSupabaseAuthUser('user-123');
    mockSupabaseFrom('watchlist', builder);

    await expect(addSymbol(' aapl ')).resolves.toEqual(insertedItem);
    expect(builder.insert).toHaveBeenCalledWith({ user_id: 'user-123', symbol: 'AAPL' });
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.single).toHaveBeenCalledTimes(1);
  });

  it('addSymbol throws on empty symbol', async () => {
    mockSupabaseAuthUser('user-123');

    await expect(addSymbol('   ')).rejects.toThrow('Symbol is required');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('addSymbol throws on duplicate', async () => {
    const builder = createQueryBuilderMock({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      }),
    });

    mockSupabaseAuthUser('user-123');
    mockSupabaseFrom('watchlist', builder);

    await expect(addSymbol('AAPL')).rejects.toThrow('Symbol is already in watchlist');
  });

  it('addSymbol throws readable messages on other Supabase errors', async () => {
    const builder = createQueryBuilderMock({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'network unavailable' },
      }),
    });

    mockSupabaseAuthUser('user-123');
    mockSupabaseFrom('watchlist', builder);

    await expect(addSymbol('MSFT')).rejects.toThrow('Unable to add symbol: network unavailable');
  });

  it('removeSymbol deletes row for user and normalized symbol', async () => {
    const builder = createQueryBuilderMock();
    builder.eq.mockReturnValueOnce(builder).mockResolvedValueOnce({ error: null });

    mockSupabaseAuthUser('user-123');
    mockSupabaseFrom('watchlist', builder);

    await expect(removeSymbol(' msft ')).resolves.toBeUndefined();
    expect(builder.delete).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'symbol', 'MSFT');
  });

  it('removeSymbol throws on empty symbol', async () => {
    mockSupabaseAuthUser('user-123');

    await expect(removeSymbol('')).rejects.toThrow('Symbol is required');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('removeSymbol throws readable messages on Supabase errors', async () => {
    const builder = createQueryBuilderMock();
    builder.eq.mockReturnValueOnce(builder).mockResolvedValueOnce({
      error: { message: 'permission denied' },
    });

    mockSupabaseAuthUser('user-123');
    mockSupabaseFrom('watchlist', builder);

    await expect(removeSymbol('TSLA')).rejects.toThrow('Unable to remove symbol: permission denied');
  });
});
