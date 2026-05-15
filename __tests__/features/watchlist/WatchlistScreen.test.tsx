import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { WatchlistScreen } from '../../../src/features/watchlist/WatchlistScreen';
import { FinnhubService } from '../../../src/core/api/finnhubService';
import type { SearchStackParamList } from '../../../src/navigation/types';

jest.mock('../../../src/core/api/finnhubService', () => ({
  FinnhubService: {
    getQuote: jest.fn(),
  },
}));

const mockFetchWatchlist = jest.fn();
const mockRemoveSymbol = jest.fn();

let mockWatchlistState = {
  symbols: ['AAPL', 'MSFT'],
  loading: false,
  error: null as string | null,
  fetchWatchlist: mockFetchWatchlist,
  removeSymbol: mockRemoveSymbol,
};

jest.mock('../../../src/stores/watchlistStore', () => ({
  useWatchlistStore: () => mockWatchlistState,
}));

const mockedFinnhubService = FinnhubService as jest.Mocked<typeof FinnhubService>;
const Stack = createNativeStackNavigator<SearchStackParamList>();

const StockDetailStub = ({ route }: { route: RouteProp<SearchStackParamList, 'StockDetail'> }) => (
  <Text>{route.params.symbol} detail</Text>
);

function renderWatchlistScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Watchlist" component={WatchlistScreen} />
        <Stack.Screen name="StockDetail" component={StockDetailStub} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('WatchlistScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWatchlistState = {
      symbols: ['AAPL', 'MSFT'],
      loading: false,
      error: null,
      fetchWatchlist: mockFetchWatchlist,
      removeSymbol: mockRemoveSymbol,
    };
    mockFetchWatchlist.mockResolvedValue(undefined);
    mockRemoveSymbol.mockResolvedValue(undefined);
    mockedFinnhubService.getQuote.mockImplementation(async (symbol: string) => ({
      currentPrice: symbol === 'AAPL' ? 185.5 : 412.3,
      open: 180,
      high: 190,
      low: 178,
      previousClose: 184,
      change: 1.5,
      changePercent: symbol === 'AAPL' ? 0.82 : -0.34,
    }));
  });

  it('fetches the watchlist and renders quote rows', async () => {
    const { getByTestId, getByText } = renderWatchlistScreen();

    expect(mockFetchWatchlist).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(getByTestId('stock-row-AAPL')).toBeTruthy();
      expect(getByTestId('stock-row-MSFT')).toBeTruthy();
    });

    expect(mockedFinnhubService.getQuote).toHaveBeenCalledWith('AAPL');
    expect(mockedFinnhubService.getQuote).toHaveBeenCalledWith('MSFT');
    expect(getByText('$185.50')).toBeTruthy();
  });

  it('opens stock detail from a row', async () => {
    const { getByTestId, getByText } = renderWatchlistScreen();

    await waitFor(() => {
      expect(getByTestId('stock-row-AAPL')).toBeTruthy();
    });

    fireEvent.press(getByTestId('stock-row-AAPL'));

    await waitFor(() => {
      expect(getByText('AAPL detail')).toBeTruthy();
    });
  });

  it('removes a watched symbol', async () => {
    const { getByTestId } = renderWatchlistScreen();

    await waitFor(() => {
      expect(getByTestId('remove-watchlist-AAPL')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('remove-watchlist-AAPL'));
    });

    expect(mockRemoveSymbol).toHaveBeenCalledWith('AAPL');
  });

  it('renders empty and error states', () => {
    mockWatchlistState = {
      ...mockWatchlistState,
      symbols: [],
      error: 'Watchlist unavailable',
    };

    const { getByTestId, getByText } = renderWatchlistScreen();

    expect(getByTestId('watchlist-error')).toBeTruthy();
    expect(getByText('Watchlist unavailable')).toBeTruthy();
  });

  it('surfaces quote load failures without dropping symbols', async () => {
    mockedFinnhubService.getQuote.mockRejectedValueOnce(new Error('Quote failed'));
    const { getByTestId } = renderWatchlistScreen();

    await waitFor(() => {
      expect(getByTestId('watchlist-quotes-error')).toBeTruthy();
      expect(getByTestId('stock-row-AAPL')).toBeTruthy();
    });
  });
});
