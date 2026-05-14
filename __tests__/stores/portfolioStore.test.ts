import { act, renderHook } from '@testing-library/react-native';
import { Holding, Trade } from '../../src/core/api/database.types';

jest.mock('../../src/services/portfolioService', () => ({
  getHoldings: jest.fn(),
  getHolding: jest.fn(),
}), { virtual: true });

jest.mock('../../src/services/tradeService', () => ({
  getTradeHistory: jest.fn(),
  getTradeCount: jest.fn(),
}), { virtual: true });

jest.mock('../../src/services/userService', () => ({
  getBalance: jest.fn(),
  getCurrentUser: jest.fn(),
}), { virtual: true });

import { usePortfolioStore } from '../../src/stores/portfolioStore';
import * as portfolioService from '../../src/services/portfolioService';
import * as tradeService from '../../src/services/tradeService';
import * as userService from '../../src/services/userService';

const mockPortfolioService = portfolioService as jest.Mocked<typeof portfolioService>;
const mockTradeService = tradeService as jest.Mocked<typeof tradeService>;
const mockUserService = userService as jest.Mocked<typeof userService>;

const initialState = {
  holdings: [],
  trades: [],
  cash: null,
  loading: false,
  error: null,
};

const holding: Holding = {
  id: 'holding-1',
  user_id: 'user-1',
  symbol: 'AAPL',
  shares: 10,
  avg_cost_basis: 150,
  updated_at: '2026-01-01T00:00:00.000Z',
};

const trade: Trade = {
  id: 'trade-1',
  user_id: 'user-1',
  symbol: 'AAPL',
  side: 'buy',
  order_type: 'market',
  shares: 2,
  price: 175,
  total: 350,
  status: 'executed',
  executed_at: '2026-01-02T00:00:00.000Z',
};

beforeEach(() => {
  usePortfolioStore.setState(initialState);
  jest.clearAllMocks();
});

describe('portfolioStore', () => {
  it('fetchPortfolio loads holdings and cash', async () => {
    mockPortfolioService.getHoldings.mockResolvedValue([holding]);
    mockUserService.getBalance.mockResolvedValue(98765);

    const { result } = renderHook(() => usePortfolioStore());
    await act(async () => { await result.current.fetchPortfolio(); });

    expect(result.current.holdings).toEqual([holding]);
    expect(result.current.cash).toBe(98765);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchTrades loads trade array and passes optional side', async () => {
    mockTradeService.getTradeHistory.mockResolvedValue([trade]);

    const { result } = renderHook(() => usePortfolioStore());
    await act(async () => { await result.current.fetchTrades('buy'); });

    expect(mockTradeService.getTradeHistory).toHaveBeenCalledWith('buy');
    expect(result.current.trades).toEqual([trade]);
    expect(result.current.loading).toBe(false);
  });

  it('sets readable error on portfolio failure and clears loading', async () => {
    mockPortfolioService.getHoldings.mockRejectedValue(new Error('Holdings unavailable'));
    mockUserService.getBalance.mockResolvedValue(1000);

    const { result } = renderHook(() => usePortfolioStore());
    await act(async () => { await result.current.fetchPortfolio(); });

    expect(result.current.error).toBe('Holdings unavailable');
    expect(result.current.loading).toBe(false);
  });

  it('sets readable error on trades failure', async () => {
    mockTradeService.getTradeHistory.mockRejectedValue(new Error('Trades unavailable'));

    const { result } = renderHook(() => usePortfolioStore());
    await act(async () => { await result.current.fetchTrades(); });

    expect(result.current.error).toBe('Trades unavailable');
    expect(result.current.loading).toBe(false);
  });

  it('clearError clears error and reset restores initial state', () => {
    usePortfolioStore.setState({
      holdings: [holding],
      trades: [trade],
      cash: 123,
      loading: true,
      error: 'Problem',
    });

    const { result } = renderHook(() => usePortfolioStore());
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();

    act(() => { result.current.reset(); });
    expect(result.current.holdings).toEqual([]);
    expect(result.current.trades).toEqual([]);
    expect(result.current.cash).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
