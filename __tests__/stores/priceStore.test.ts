import { act, renderHook } from '@testing-library/react-native';
import {
  PriceWebSocketManager,
  setPriceWebSocketManager,
  usePriceStore,
} from '../../src/stores/priceStore';
import { MAX_FINNHUB_SUBSCRIPTIONS } from '../../src/core/websocket/finnhubWebSocket';

function makeManager(): jest.Mocked<PriceWebSocketManager> {
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  };
}

const initialState = {
  pricesBySymbol: {},
  activeSymbols: [],
  connected: false,
  connecting: false,
  error: null,
};

describe('priceStore', () => {
  let manager: jest.Mocked<PriceWebSocketManager>;

  beforeEach(() => {
    manager = makeManager();
    setPriceWebSocketManager(manager);
    usePriceStore.setState(initialState);
    jest.clearAllMocks();
  });

  afterEach(() => {
    setPriceWebSocketManager(null);
  });

  it('connect and disconnect delegate to the WebSocket manager', () => {
    const { result } = renderHook(() => usePriceStore());

    act(() => {
      result.current.connect();
      result.current.disconnect();
    });

    expect(manager.connect).toHaveBeenCalledTimes(1);
    expect(manager.disconnect).toHaveBeenCalledTimes(1);
    expect(result.current.activeSymbols).toEqual([]);
  });

  it('subscribe normalizes, dedupes, caps active symbols, and delegates additions', () => {
    const symbols = [' aapl ', 'AAPL', ...Array.from({ length: 60 }, (_, index) => `T${index}`)];
    const { result } = renderHook(() => usePriceStore());

    act(() => {
      result.current.subscribe(symbols);
    });

    expect(result.current.activeSymbols).toHaveLength(MAX_FINNHUB_SUBSCRIPTIONS);
    expect(result.current.activeSymbols[0]).toBe('AAPL');
    expect(manager.subscribe).toHaveBeenCalledWith(result.current.activeSymbols);
  });

  it('unsubscribe removes active symbols and delegates removals', () => {
    usePriceStore.setState({ activeSymbols: ['AAPL', 'MSFT', 'TSLA'] });
    const { result } = renderHook(() => usePriceStore());

    act(() => {
      result.current.unsubscribe([' msft ', 'TSLA']);
    });

    expect(result.current.activeSymbols).toEqual(['AAPL']);
    expect(manager.unsubscribe).toHaveBeenCalledWith(['MSFT', 'TSLA']);
  });

  it('updatePrice stores first and subsequent live prices with deltas', () => {
    const { result } = renderHook(() => usePriceStore());

    act(() => {
      result.current.updatePrice(' aapl ', 100, 1_000);
      result.current.updatePrice('AAPL', 110, 2_000);
    });

    expect(result.current.pricesBySymbol.AAPL).toEqual({
      symbol: 'AAPL',
      price: 110,
      timestamp: 2_000,
      previousPrice: 100,
      change: 10,
      changePercent: 10,
    });
  });

  it('clearError and reset restore state', () => {
    usePriceStore.setState({
      pricesBySymbol: {
        AAPL: { symbol: 'AAPL', price: 100, timestamp: 1_000 },
      },
      activeSymbols: ['AAPL'],
      connected: true,
      connecting: false,
      error: 'Problem',
    });

    const { result } = renderHook(() => usePriceStore());

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.reset();
    });
    expect(result.current.pricesBySymbol).toEqual({});
    expect(result.current.activeSymbols).toEqual([]);
    expect(result.current.connected).toBe(false);
  });
});
