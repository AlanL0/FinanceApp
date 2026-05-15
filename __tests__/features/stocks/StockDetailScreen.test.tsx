import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StockDetailScreen } from '../../../src/features/stocks/StockDetailScreen';
import { FinnhubService } from '../../../src/core/api/finnhubService';
import type { SearchStackParamList } from '../../../src/navigation/types';

jest.mock('../../../src/core/api/finnhubService', () => ({
  FinnhubService: {
    getQuote: jest.fn(),
    getCompanyProfile: jest.fn(),
  },
}));

const mockFetchWatchlist = jest.fn();
const mockAddSymbol = jest.fn();
const mockRemoveSymbol = jest.fn();

let mockWatchlistState = {
  symbols: [] as string[],
  loading: false,
  error: null as string | null,
  fetchWatchlist: mockFetchWatchlist,
  addSymbol: mockAddSymbol,
  removeSymbol: mockRemoveSymbol,
};

jest.mock('../../../src/stores/watchlistStore', () => ({
  useWatchlistStore: () => mockWatchlistState,
}));

const mockedFinnhubService = FinnhubService as jest.Mocked<typeof FinnhubService>;
const Stack = createNativeStackNavigator<SearchStackParamList>();

function renderStockDetail(initialParams = { symbol: 'AAPL', description: 'Apple Inc' }) {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="StockDetail"
          component={StockDetailScreen}
          initialParams={initialParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('StockDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWatchlistState = {
      symbols: [],
      loading: false,
      error: null,
      fetchWatchlist: mockFetchWatchlist,
      addSymbol: mockAddSymbol,
      removeSymbol: mockRemoveSymbol,
    };
    mockFetchWatchlist.mockResolvedValue(undefined);
    mockAddSymbol.mockResolvedValue(undefined);
    mockRemoveSymbol.mockResolvedValue(undefined);
    mockedFinnhubService.getQuote.mockResolvedValue({
      currentPrice: 185.5,
      open: 183.2,
      high: 186,
      low: 182.5,
      previousClose: 184,
      change: 1.5,
      changePercent: 0.82,
      source: 'network',
    });
    mockedFinnhubService.getCompanyProfile.mockResolvedValue({
      symbol: 'AAPL',
      name: 'Apple Inc',
      exchange: 'NASDAQ NMS - GLOBAL MARKET',
      industry: 'Technology',
      logo: 'https://static.finnhub.io/logo/aapl.png',
      webUrl: 'https://www.apple.com/',
    });
  });

  it('renders quote, chart, stats, and trade placeholders', async () => {
    const { getByText, getByTestId } = renderStockDetail();

    expect(getByTestId('stock-detail-loading')).toBeTruthy();

    await waitFor(() => {
      expect(getByTestId('stock-detail-price')).toBeTruthy();
    });

    expect(mockedFinnhubService.getQuote).toHaveBeenCalledWith('AAPL');
    expect(mockedFinnhubService.getCompanyProfile).toHaveBeenCalledWith('AAPL');
    expect(getByText('Apple Inc')).toBeTruthy();
    expect(getByTestId('company-logo')).toBeTruthy();
    expect(getByText('$185.50')).toBeTruthy();
    expect(getByTestId('price-chart')).toBeTruthy();
    expect(getByTestId('stock-stat-open')).toBeTruthy();
    expect(getByTestId('stock-stat-prev-close')).toBeTruthy();
    expect(getByText('Buy')).toBeTruthy();
    expect(getByText('Sell')).toBeTruthy();
  });

  it('adds the symbol to the watchlist', async () => {
    const { getByTestId } = renderStockDetail();

    await waitFor(() => {
      expect(getByTestId('watchlist-toggle')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('watchlist-toggle'));
    });

    expect(mockAddSymbol).toHaveBeenCalledWith('AAPL');
  });

  it('removes the symbol when already watched', async () => {
    mockWatchlistState = {
      ...mockWatchlistState,
      symbols: ['AAPL'],
    };
    const { getByTestId, getByText } = renderStockDetail();

    await waitFor(() => {
      expect(getByText('Remove')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('watchlist-toggle'));
    });

    expect(mockRemoveSymbol).toHaveBeenCalledWith('AAPL');
  });

  it('renders quote errors', async () => {
    mockedFinnhubService.getQuote.mockRejectedValueOnce(new Error('Quote unavailable'));
    const { getByTestId, getByText } = renderStockDetail();

    await waitFor(() => {
      expect(getByTestId('stock-detail-error')).toBeTruthy();
    });

    expect(getByText('Quote unavailable')).toBeTruthy();
  });

  it('falls back to ticker logo initials when profile loading fails', async () => {
    mockedFinnhubService.getCompanyProfile.mockRejectedValueOnce(new Error('Profile unavailable'));
    const { getByTestId } = renderStockDetail();

    await waitFor(() => {
      expect(getByTestId('company-logo-fallback')).toBeTruthy();
    });
  });

  it('changes chart range from segmented control', async () => {
    const { getByTestId } = renderStockDetail();

    await waitFor(() => {
      expect(getByTestId('price-chart')).toBeTruthy();
    });

    fireEvent.press(getByTestId('segment-1Y'));

    expect(getByTestId('segment-1Y').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: expect.any(String) })])
    );
  });
});
