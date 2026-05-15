import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { WatchlistScreen } from '../../../src/features/watchlist/WatchlistScreen';
import { FinnhubService } from '../../../src/core/api/finnhubService';
import type { MainTabParamList, SearchStackParamList } from '../../../src/navigation/types';

jest.mock('../../../src/core/api/finnhubService', () => ({
  FinnhubService: {
    getQuote: jest.fn(),
    getCompanyProfile: jest.fn(),
  },
}));

const mockFetchWatchlist = jest.fn();
const mockRemoveSymbol = jest.fn();
const mockMoveSymbolToIndex = jest.fn();

let mockWatchlistState = {
  symbols: ['AAPL', 'MSFT'],
  loading: false,
  error: null as string | null,
  fetchWatchlist: mockFetchWatchlist,
  removeSymbol: mockRemoveSymbol,
  moveSymbolToIndex: mockMoveSymbolToIndex,
};

jest.mock('../../../src/stores/watchlistStore', () => ({
  useWatchlistStore: () => mockWatchlistState,
}));

const mockedFinnhubService = FinnhubService as jest.Mocked<typeof FinnhubService>;
const Stack = createNativeStackNavigator<SearchStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const StockDetailStub = ({ route }: { route: RouteProp<SearchStackParamList, 'StockDetail'> }) => (
  <Text>{route.params.symbol} detail</Text>
);
const HomeStub = () => <Text>Home Screen</Text>;
const SearchHomeStub = () => <Text>Search Home</Text>;
const PlaceholderStub = () => null;

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

const SearchStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SearchHome" component={SearchHomeStub} />
    <Stack.Screen name="Watchlist" component={WatchlistScreen} />
    <Stack.Screen name="StockDetail" component={StockDetailStub} />
  </Stack.Navigator>
);

function renderNestedWatchlistScreen() {
  return render(
    <NavigationContainer
      initialState={{
        index: 1,
        routes: [
          { name: 'Home' },
          {
            name: 'Search',
            state: {
              index: 0,
              routes: [{ name: 'Watchlist' }],
            },
          },
        ],
      }}
    >
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeStub} />
        <Tab.Screen name="Search" component={SearchStackNavigator} />
        <Tab.Screen name="Portfolio" component={PlaceholderStub} />
        <Tab.Screen name="Learn" component={PlaceholderStub} />
        <Tab.Screen name="Profile" component={PlaceholderStub} />
      </Tab.Navigator>
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
      moveSymbolToIndex: mockMoveSymbolToIndex,
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
    mockedFinnhubService.getCompanyProfile.mockImplementation(async (symbol: string) => ({
      symbol,
      name: symbol === 'AAPL' ? 'Apple Inc' : 'Microsoft Corp',
      exchange: 'NASDAQ NMS - GLOBAL MARKET',
      industry: 'Technology',
      logo: `https://static.finnhub.io/logo/${symbol.toLowerCase()}.png`,
      webUrl: `https://www.${symbol.toLowerCase()}.com/`,
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
    expect(mockedFinnhubService.getCompanyProfile).toHaveBeenCalledWith('AAPL');
    expect(mockedFinnhubService.getCompanyProfile).toHaveBeenCalledWith('MSFT');
    expect(getByText('$185.50')).toBeTruthy();
  });

  it('renders company logos in watchlist rows', async () => {
    const { getByTestId, getByText } = renderWatchlistScreen();

    await waitFor(() => {
      expect(getByTestId('stock-row-logo-AAPL-image')).toBeTruthy();
    });

    expect(getByText('Apple Inc')).toBeTruthy();
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

  it('returns to Home when pressing the screen-owned Back button', async () => {
    const { getByTestId, getByText } = renderNestedWatchlistScreen();

    await waitFor(() => {
      expect(getByTestId('watchlist-back-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('watchlist-back-button'));

    await waitFor(() => {
      expect(getByText('Home Screen')).toBeTruthy();
    });
  });

  it('reorders rows by long pressing, dragging, and releasing', async () => {
    const { getByTestId, queryByText } = renderWatchlistScreen();

    await waitFor(() => {
      expect(getByTestId('stock-row-AAPL')).toBeTruthy();
    });

    fireEvent(getByTestId('stock-row-AAPL'), 'longPress', { nativeEvent: { pageY: 100 } });
    expect(queryByText('Move up')).toBeNull();
    expect(queryByText('Move down')).toBeNull();

    fireEvent(getByTestId('watchlist-list'), 'touchMove', { nativeEvent: { pageY: 210 } });
    expect(mockMoveSymbolToIndex).toHaveBeenCalledWith('AAPL', 1);

    fireEvent(getByTestId('watchlist-list'), 'touchEnd', { nativeEvent: { pageY: 210 } });
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
