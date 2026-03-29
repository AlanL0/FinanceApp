import React from 'react';
import { render } from '@testing-library/react-native';
import { MetricCard } from '../../src/components/MetricCard';

describe('MetricCard', () => {
  it('renders the label', () => {
    const { getByText } = render(<MetricCard label="Total Value" value="$50,000.00" />);
    expect(getByText('Total Value')).toBeTruthy();
  });

  it('renders the value', () => {
    const { getByText } = render(<MetricCard label="Total Value" value="$50,000.00" />);
    expect(getByText('$50,000.00')).toBeTruthy();
  });

  it('applies valueColor to the value text', () => {
    const { getByTestId } = render(
      <MetricCard label="Return" value="+2.50%" valueColor="#1D9E75" testID="value" />
    );
    const valueEl = getByTestId('value');
    expect(valueEl.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#1D9E75' })])
    );
  });
});
