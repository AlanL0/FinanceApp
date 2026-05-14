jest.mock('../../src/core/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { Holding } from '../../src/core/api/database.types';
import { getHolding, getHoldings } from '../../src/services/portfolioService';
import {
  createQueryBuilderMock,
  mockSupabaseAuthUser,
  mockSupabaseFrom,
  mockSupabaseUnauthenticated,
} from '../../test-utils/mockSupabase';

const holdings: Holding[] = [
  {
    id: 'holding-1',
    user_id: 'user-123',
    symbol: 'AAPL',
    shares: 2,
    avg_cost_basis: 150,
    updated_at: '2026-05-14T00:00:00.000Z',
  },
  {
    id: 'holding-2',
    user_id: 'user-123',
    symbol: 'MSFT',
    shares: 1,
    avg_cost_basis: 320,
    updated_at: '2026-05-14T00:00:00.000Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('portfolioService', () => {
  it('getHoldings returns array', async () => {
    mockSupabaseAuthUser('user-123');
    const builder = createQueryBuilderMock({
      order: jest.fn().mockResolvedValue({ data: holdings, error: null }),
    });
    mockSupabaseFrom('holdings', builder);

    await expect(getHoldings()).resolves.toEqual(holdings);
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(builder.order).toHaveBeenCalledWith('symbol', { ascending: true });
  });

  it('getHolding returns single holding with normalized symbol', async () => {
    mockSupabaseAuthUser('user-123');
    const builder = createQueryBuilderMock({
      maybeSingle: jest.fn().mockResolvedValue({ data: holdings[0], error: null }),
    });
    mockSupabaseFrom('holdings', builder);

    await expect(getHolding(' aapl ')).resolves.toEqual(holdings[0]);
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(builder.eq).toHaveBeenCalledWith('symbol', 'AAPL');
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it('getHolding returns null when holding is not found', async () => {
    mockSupabaseAuthUser('user-123');
    const builder = createQueryBuilderMock({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockSupabaseFrom('holdings', builder);

    await expect(getHolding('TSLA')).resolves.toBeNull();
  });

  it('portfolio methods require authentication', async () => {
    mockSupabaseUnauthenticated();

    await expect(getHoldings()).rejects.toThrow('User is not authenticated');
    await expect(getHolding('AAPL')).rejects.toThrow('User is not authenticated');
  });

  it('getHoldings throws readable error on Supabase failure', async () => {
    mockSupabaseAuthUser('user-123');
    const builder = createQueryBuilderMock({
      order: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'database unavailable' },
      }),
    });
    mockSupabaseFrom('holdings', builder);

    await expect(getHoldings()).rejects.toThrow('Failed to load holdings: database unavailable');
  });

  it('getHolding throws readable error on Supabase failure', async () => {
    mockSupabaseAuthUser('user-123');
    const builder = createQueryBuilderMock({
      maybeSingle: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'database unavailable' },
      }),
    });
    mockSupabaseFrom('holdings', builder);

    await expect(getHolding('AAPL')).rejects.toThrow('Failed to load holding: database unavailable');
  });
});
