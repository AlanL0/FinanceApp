import React from 'react';
import { render } from '@testing-library/react-native';
import { PriceChart } from '../../../src/features/stocks/components/PriceChart';

describe('PriceChart', () => {
  it('renders an empty placeholder for fewer than two points', () => {
    const { getByTestId, queryByTestId } = render(<PriceChart points={[100]} />);

    expect(getByTestId('price-chart-empty')).toBeTruthy();
    expect(queryByTestId('price-chart')).toBeNull();
  });

  it('renders a polyline for chart points', () => {
    const { getByTestId } = render(
      <PriceChart points={[100, 101.25, 100.75, 103]} color="#1D9E75" />
    );

    expect(getByTestId('price-chart')).toBeTruthy();
    expect(getByTestId('price-chart-line')).toBeTruthy();
  });
});
