import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StockRow } from '../../src/components/StockRow';

describe('StockRow', () => {
  const defaultProps = {
    symbol: 'AAPL',
    name: 'Apple Inc',
    price: 185.50,
    changePercent: 0.82,
    sector: 'Technology',
    onPress: jest.fn(),
  };

  it('renders the symbol', () => {
    const { getByText } = render(<StockRow {...defaultProps} />);
    expect(getByText('AAPL')).toBeTruthy();
  });

  it('renders the company name', () => {
    const { getByText } = render(<StockRow {...defaultProps} />);
    expect(getByText('Apple Inc')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<StockRow {...defaultProps} onPress={onPress} />);
    fireEvent.press(getByTestId('stock-row-AAPL'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows positive color for gains', () => {
    const { getByTestId } = render(
      <StockRow {...defaultProps} changePercent={1.5} />
    );
    const changePct = getByTestId('change-pct-AAPL');
    expect(changePct.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#1D9E75' })])
    );
  });

  it('shows negative color for losses', () => {
    const { getByTestId } = render(
      <StockRow {...defaultProps} changePercent={-0.34} />
    );
    const changePct = getByTestId('change-pct-AAPL');
    expect(changePct.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#E24B4A' })])
    );
  });
});
