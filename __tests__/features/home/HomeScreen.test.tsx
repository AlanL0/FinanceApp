import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import { HomeScreen } from '../../../src/features/home/HomeScreen';
import { FinnhubService } from '../../../src/core/api/finnhubService';
import { usePortfolioStore } from '../../../src/stores/portfolioStore';
import { useWatchlistStore } from '../../../src/stores/watchlistStore';
import { usePriceStore } from '../../../src/stores/priceStore';
import { Holding } from '../../../src/core/api/database.types';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../../src/core/api/finnhubService', () => ({
  FinnhubService: {
    getQuote: jest.fn(),
    getCompanyProfile: jest.fn(),
  },
}));

jest.mock('../../../src/stores/portfolioStore', () => ({
  usePortfolioStore: jest.fn(),
}));

jest.mock('../../../src/stores/watchlistStore', () => ({
  useWatchlistStore: jest.fn(),
}));

jest.mock('../../../src/stores/priceStore', () => ({
  usePriceStore: jest.fn(),
}));

const mockedFinnhubService = FinnhubService as jest.Mocked<typeof FinnhubService>;
const mockUsePortfolioStore = usePortfolioStore as unknown as jest.Mock;
const mockUseWatchlistStore = useWatchlistStore as unknown as jest.Mock;
const mockUsePriceStore = usePriceStore as unknown as jest.Mock;

const appleHolding: Holding = {
  id: 'holding-aapl',
  user_id: 'user-1',
  symbol: 'AAPL',
  shares: 2,
  avg_cost_basis: 100,
  updated_at: '2026-01-01T00:00:00.000Z',
};

const defaultPortfolioState = {
  holdings: [appleHolding],
  trades: [],
  cash: 1_000,
  loading: false,
  error: null as string | null,
  fetchPortfolio: jest.fn(),
  fetchTrades: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
};

const defaultWatchlistState = {
  items: [],
  symbols: ['AAPL', 'MSFT'],
  loading: false,
  error: null as string | null,
  fetchWatchlist: jest.fn(),
  addSymbol: jest.fn(),
  removeSymbol: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
};

const defaultPriceState = {
  pricesBySymbol: {},
  activeSymbols: [],
  connected: false,
  connecting: false,
  error: null as string | null,
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  updatePrice: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
};

function mockStores({
  portfolio = {},
  watchlist = {},
  price = {},
}: {
  portfolio?: Partial<typeof defaultPortfolioState>;
  watchlist?: Partial<typeof defaultWatchlistState>;
  price?: Partial<typeof defaultPriceState>;
} = {}) {
  const portfolioState = { ...defaultPortfolioState, ...portfolio };
  const watchlistState = { ...defaultWatchlistState, ...watchlist };
  const priceState = { ...defaultPriceState, ...price };

  mockUsePortfolioStore.mockReturnValue(portfolioState);
  mockUseWatchlistStore.mockReturnValue(watchlistState);
  mockUsePriceStore.mockReturnValue(priceState);

  return { portfolioState, watchlistState, priceState };
}

function mockQuote(symbol: string) {
  const quotes = {
    AAPL: {
      currentPrice: 200,
      open: 198,
      high: 205,
      low: 197,
      previousClose: 195,
      change: 5,
      changePercent: 2.56,
    },
    MSFT: {
      currentPrice: 300,
      open: 305,
      high: 306,
      low: 298,
      previousClose: 303,
      change: -3,
      changePercent: -0.99,
    },
  };

  return Promise.resolve(quotes[symbol as keyof typeof quotes]);
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockedFinnhubService.getQuote.mockReturnValue(new Promise(() => {}));
    mockedFinnhubService.getCompanyProfile.mockReturnValue(new Promise(() => {}));
    mockStores();
  });

  it('loads portfolio/watchlist stores, connects live prices, and subscribes tracked symbols', async () => {
    const { portfolioState, watchlistState, priceState } = mockStores();
    render(<HomeScreen />);

    expect(portfolioState.fetchPortfolio).toHaveBeenCalledTimes(1);
    expect(watchlistState.fetchWatchlist).toHaveBeenCalledTimes(1);
    expect(priceState.connect).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(priceState.subscribe).toHaveBeenCalledWith(['AAPL', 'MSFT']);
    });
  });

  it('computes portfolio value from live prices first', () => {
    mockStores({
      price: {
        pricesBySymbol: {
          AAPL: { symbol: 'AAPL', price: 210, timestamp: 1_000, change: 2, changePercent: 0.96 },
          MSFT: { symbol: 'MSFT', price: 300, timestamp: 1_000, change: -3, changePercent: -0.99 },
        },
      },
    });

    const { getByTestId } = render(<HomeScreen />);

    expect(getByTestId('portfolio-total')).toHaveTextContent('$1,420.00');
    expect(mockedFinnhubService.getQuote).not.toHaveBeenCalled();
  });

  it('falls back to REST quotes when live prices are missing', async () => {
    mockedFinnhubService.getQuote.mockImplementation(mockQuote);
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('portfolio-total')).toHaveTextContent('$1,400.00');
    });

    expect(mockedFinnhubService.getQuote).toHaveBeenCalledWith('AAPL');
    expect(mockedFinnhubService.getQuote).toHaveBeenCalledWith('MSFT');
    expect(within(getByTestId('market-snapshot-quote')).getByText('$200.00')).toBeTruthy();
  });

  it('renders loading and error states from stores', () => {
    mockStores({
      portfolio: { loading: true, error: 'Portfolio unavailable' },
      watchlist: { error: 'Watchlist unavailable' },
      price: { error: 'Live prices unavailable' },
    });

    const { getByTestId, getByText } = render(<HomeScreen />);

    expect(getByTestId('home-loading')).toBeTruthy();
    expect(getByTestId('home-error')).toBeTruthy();
    expect(getByText(/Portfolio unavailable/)).toBeTruthy();
    expect(getByText(/Watchlist unavailable/)).toBeTruthy();
    expect(getByText(/Live prices unavailable/)).toBeTruthy();
  });

  it('renders real watchlist rows instead of mocks', async () => {
    const { getAllByTestId, getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('stock-row-AAPL')).toBeTruthy();
      expect(getByTestId('stock-row-MSFT')).toBeTruthy();
    });

    expect(getAllByTestId(/^stock-row-(AAPL|MSFT)$/)).toHaveLength(2);
  });

  it('renders watchlist logos from company profiles', async () => {
    mockedFinnhubService.getCompanyProfile.mockImplementation(async (symbol: string) => ({
      symbol,
      name: symbol === 'AAPL' ? 'Apple Inc' : 'Microsoft Corp',
      exchange: 'NASDAQ NMS - GLOBAL MARKET',
      industry: 'Technology',
      logo: `https://static.finnhub.io/logo/${symbol.toLowerCase()}.png`,
      webUrl: `https://www.${symbol.toLowerCase()}.com/`,
    }));

    const { getByTestId, getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('stock-row-logo-AAPL-image')).toBeTruthy();
    });

    expect(mockedFinnhubService.getCompanyProfile).toHaveBeenCalledWith('AAPL');
    expect(getByText('Apple Inc')).toBeTruthy();
  });

  it('uses live AAPL for the market snapshot when available', () => {
    mockStores({
      watchlist: { symbols: [] },
      price: {
        pricesBySymbol: {
          AAPL: { symbol: 'AAPL', price: 222, timestamp: 1_000, change: 4, changePercent: 1.83 },
        },
      },
    });

    const { getByTestId } = render(<HomeScreen />);

    expect(within(getByTestId('market-snapshot-quote')).getByText('$222.00')).toBeTruthy();
    expect(mockedFinnhubService.getQuote).not.toHaveBeenCalled();
  });

  it('renders an empty watchlist state', () => {
    mockStores({ watchlist: { symbols: [] } });

    const { getByTestId } = render(<HomeScreen />);

    expect(getByTestId('home-watchlist-empty')).toBeTruthy();
  });

  it('navigates watchlist rows and See all to Search stack screens', async () => {
    const { getByTestId, getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('stock-row-MSFT')).toBeTruthy();
    });

    fireEvent.press(getByTestId('stock-row-MSFT'));
    expect(mockNavigate).toHaveBeenCalledWith('Search', {
      screen: 'StockDetail',
      params: { symbol: 'MSFT' },
    });

    fireEvent.press(getByText('See all →'));
    expect(mockNavigate).toHaveBeenCalledWith('Search', {
      screen: 'Watchlist',
      params: { returnToHome: true },
    });
  });
});
