import { act, renderHook } from '@testing-library/react-native';
import { WatchlistItem } from '../../src/core/api/database.types';

jest.mock('../../src/services/watchlistService', () => ({
  getWatchlist: jest.fn(),
  addSymbol: jest.fn(),
  removeSymbol: jest.fn(),
}), { virtual: true });

import { useWatchlistStore } from '../../src/stores/watchlistStore';
import * as watchlistService from '../../src/services/watchlistService';

const mockWatchlistService = watchlistService as jest.Mocked<typeof watchlistService>;

const initialState = {
  items: [],
  symbols: [],
  loading: false,
  error: null,
};

function makeWatchlistItem(symbol: string): WatchlistItem {
  return {
    id: `watchlist-${symbol}`,
    user_id: 'user-1',
    symbol,
    added_at: '2026-01-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  useWatchlistStore.setState(initialState);
  jest.clearAllMocks();
});

describe('watchlistStore', () => {
  it('fetch populates items and derived symbols', async () => {
    const items = [makeWatchlistItem('AAPL'), makeWatchlistItem('MSFT')];
    mockWatchlistService.getWatchlist.mockResolvedValue(items);

    const { result } = renderHook(() => useWatchlistStore());
    await act(async () => { await result.current.fetchWatchlist(); });

    expect(result.current.items).toEqual(items);
    expect(result.current.symbols).toEqual(['AAPL', 'MSFT']);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('add appends returned item and symbol', async () => {
    const existingItem = makeWatchlistItem('AAPL');
    const addedItem = makeWatchlistItem('NVDA');
    useWatchlistStore.setState({
      items: [existingItem],
      symbols: ['AAPL'],
    });
    mockWatchlistService.addSymbol.mockResolvedValue(addedItem);

    const { result } = renderHook(() => useWatchlistStore());
    await act(async () => { await result.current.addSymbol('nvda'); });

    expect(mockWatchlistService.addSymbol).toHaveBeenCalledWith('nvda');
    expect(result.current.items).toEqual([existingItem, addedItem]);
    expect(result.current.symbols).toEqual(['AAPL', 'NVDA']);
    expect(result.current.loading).toBe(false);
  });

  it('remove filters item and symbol by normalized symbol', async () => {
    const appleItem = makeWatchlistItem('AAPL');
    const teslaItem = makeWatchlistItem('TSLA');
    useWatchlistStore.setState({
      items: [appleItem, teslaItem],
      symbols: ['AAPL', 'TSLA'],
    });
    mockWatchlistService.removeSymbol.mockResolvedValue(undefined);

    const { result } = renderHook(() => useWatchlistStore());
    await act(async () => { await result.current.removeSymbol(' aapl '); });

    expect(mockWatchlistService.removeSymbol).toHaveBeenCalledWith(' aapl ');
    expect(result.current.items).toEqual([teslaItem]);
    expect(result.current.symbols).toEqual(['TSLA']);
    expect(result.current.loading).toBe(false);
  });

  it('sets readable error on service failure and clears loading', async () => {
    mockWatchlistService.getWatchlist.mockRejectedValue(new Error('Watchlist unavailable'));

    const { result } = renderHook(() => useWatchlistStore());
    await act(async () => { await result.current.fetchWatchlist(); });

    expect(result.current.error).toBe('Watchlist unavailable');
    expect(result.current.loading).toBe(false);
  });

  it('clearError clears error and reset restores initial state', () => {
    useWatchlistStore.setState({
      items: [makeWatchlistItem('AAPL')],
      symbols: ['AAPL'],
      loading: true,
      error: 'Problem',
    });

    const { result } = renderHook(() => useWatchlistStore());
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();

    act(() => { result.current.reset(); });
    expect(result.current.items).toEqual([]);
    expect(result.current.symbols).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
