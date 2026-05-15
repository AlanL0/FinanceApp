import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { SearchScreen } from '../../../src/features/search/SearchScreen';
import { FinnhubService } from '../../../src/core/api/finnhubService';
import type { SearchStackParamList } from '../../../src/navigation/types';

jest.mock('../../../src/core/api/finnhubService', () => ({
  FinnhubService: {
    searchSymbol: jest.fn(),
    getCompanyProfile: jest.fn(),
  },
}));

const mockedFinnhubService = FinnhubService as jest.Mocked<typeof FinnhubService>;
const Stack = createNativeStackNavigator<SearchStackParamList>();

const StockDetailStub = ({ route }: { route: RouteProp<SearchStackParamList, 'StockDetail'> }) => (
  <Text>{route.params.symbol}</Text>
);

const WatchlistStub = () => <Text>Watchlist Screen</Text>;

function renderSearchScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SearchHome" component={SearchScreen} />
        <Stack.Screen name="StockDetail" component={StockDetailStub} />
        <Stack.Screen name="Watchlist" component={WatchlistStub} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockedFinnhubService.searchSymbol.mockResolvedValue([]);
    mockedFinnhubService.getCompanyProfile.mockImplementation(async (symbol: string) => ({
      symbol,
      name: `${symbol} Inc`,
      exchange: 'NASDAQ NMS - GLOBAL MARKET',
      industry: 'Technology',
      logo: `https://static.finnhub.io/logo/${symbol.toLowerCase()}.png`,
      webUrl: `https://www.${symbol.toLowerCase()}.com/`,
    }));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the search input and watchlist action', () => {
    const { getByTestId, getByText } = renderSearchScreen();

    expect(getByTestId('stock-search-input')).toBeTruthy();
    expect(getByText('Watchlist')).toBeTruthy();
  });

  it('debounces symbol search and renders results', async () => {
    mockedFinnhubService.searchSymbol.mockResolvedValueOnce([
      { symbol: 'AAPL', description: 'Apple Inc', type: 'Common Stock' },
    ]);

    const { getByTestId, getByText } = renderSearchScreen();
    fireEvent.changeText(getByTestId('stock-search-input'), 'aapl');

    expect(getByTestId('stock-search-loading')).toBeTruthy();
    expect(mockedFinnhubService.searchSymbol).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByText('Apple Inc')).toBeTruthy();
    });

    expect(mockedFinnhubService.searchSymbol).toHaveBeenCalledWith('aapl');
  });

  it('loads and renders company logos in search results', async () => {
    mockedFinnhubService.searchSymbol.mockResolvedValueOnce([
      { symbol: 'TSLA', description: 'Tesla Inc', type: 'Common Stock' },
    ]);

    const { getByTestId } = renderSearchScreen();
    fireEvent.changeText(getByTestId('stock-search-input'), 'tsla');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByTestId('search-result-TSLA')).toBeTruthy();
    });

    await waitFor(() => {
      expect(getByTestId('search-logo-TSLA-image')).toBeTruthy();
    });

    expect(mockedFinnhubService.getCompanyProfile).toHaveBeenCalledWith('TSLA');
  });

  it('limits logo profile lookups to the first visible batch', async () => {
    mockedFinnhubService.searchSymbol.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, index) => ({
        symbol: `TST${index}`,
        description: `Test ${index}`,
        type: 'Common Stock',
      })),
    );

    const { getByTestId } = renderSearchScreen();
    fireEvent.changeText(getByTestId('stock-search-input'), 'test');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByTestId('search-result-TST0')).toBeTruthy();
    });

    await waitFor(() => {
      expect(mockedFinnhubService.getCompanyProfile).toHaveBeenCalledTimes(8);
    });
  });

  it('shows an empty state when a query has no matches', async () => {
    const { getByTestId } = renderSearchScreen();
    fireEvent.changeText(getByTestId('stock-search-input'), 'zzzz');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByTestId('stock-search-empty')).toBeTruthy();
    });
  });

  it('shows service errors', async () => {
    mockedFinnhubService.searchSymbol.mockRejectedValueOnce(new Error('Search unavailable'));
    const { getByTestId, getByText } = renderSearchScreen();
    fireEvent.changeText(getByTestId('stock-search-input'), 'msft');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByTestId('stock-search-error')).toBeTruthy();
    });

    expect(getByText('Search unavailable')).toBeTruthy();
  });

  it('opens stock detail from a result', async () => {
    mockedFinnhubService.searchSymbol.mockResolvedValueOnce([
      { symbol: 'MSFT', description: 'Microsoft Corp', type: 'Common Stock' },
    ]);
    const { getByTestId, getByText } = renderSearchScreen();
    fireEvent.changeText(getByTestId('stock-search-input'), 'msft');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByTestId('search-result-MSFT')).toBeTruthy();
    });

    fireEvent.press(getByTestId('search-result-MSFT'));

    await waitFor(() => {
      expect(getByText('MSFT')).toBeTruthy();
    });
  });
});
