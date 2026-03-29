import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from '../../../src/features/home/HomeScreen';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

describe('HomeScreen', () => {
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
});
