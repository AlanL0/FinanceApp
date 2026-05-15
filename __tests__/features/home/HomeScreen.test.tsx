import React from 'react';
import { render, waitFor, within } from '@testing-library/react-native';
import { HomeScreen } from '../../../src/features/home/HomeScreen';
import { FinnhubService } from '../../../src/core/api/finnhubService';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../../src/core/api/finnhubService', () => ({
  FinnhubService: {
    getQuote: jest.fn(),
  },
}));

const mockedFinnhubService = FinnhubService as jest.Mocked<typeof FinnhubService>;

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFinnhubService.getQuote.mockReturnValue(new Promise(() => {}));
  });

  it('renders the portfolio heading', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Your portfolio')).toBeTruthy();
  });

  it('renders the total portfolio value', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('portfolio-total')).toBeTruthy();
  });

  it('renders the Watchlist section label', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Watchlist')).toBeTruthy();
  });

  it('renders 4 watchlist stock rows', () => {
    const { getAllByTestId } = render(<HomeScreen />);
    expect(getAllByTestId(/^stock-row-/)).toHaveLength(4);
  });

  it('renders the Continue Learning card', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Continue Learning')).toBeTruthy();
  });

  it('renders Market Snapshot loading state', () => {
    const { getByText, getByTestId } = render(<HomeScreen />);

    expect(getByText('Market Snapshot')).toBeTruthy();
    expect(getByTestId('market-snapshot-loading')).toBeTruthy();
  });

  it('renders loaded quote price', async () => {
    mockedFinnhubService.getQuote.mockResolvedValueOnce({
      currentPrice: 185.5,
      open: 183.2,
      high: 186,
      low: 182.5,
      previousClose: 184,
      change: 1.5,
      changePercent: 0.82,
    });
    const { getByText, getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('market-snapshot-quote')).toBeTruthy();
    });

    expect(mockedFinnhubService.getQuote).toHaveBeenCalledWith('AAPL');
    expect(within(getByTestId('market-snapshot-quote')).getByText('$185.50')).toBeTruthy();
  });

  it('renders error state when quote loading fails', async () => {
    mockedFinnhubService.getQuote.mockRejectedValueOnce(new Error('Quote unavailable'));
    const { getByText, getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('market-snapshot-error')).toBeTruthy();
    });

    expect(getByText('Quote unavailable')).toBeTruthy();
  });
});
