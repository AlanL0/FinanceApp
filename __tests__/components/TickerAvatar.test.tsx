import React from 'react';
import { render } from '@testing-library/react-native';
import { TickerAvatar } from '../../src/components/TickerAvatar';

describe('TickerAvatar', () => {
  it('renders the first 2 characters of the symbol', () => {
    const { getByText } = render(<TickerAvatar symbol="AAPL" />);
    expect(getByText('AA')).toBeTruthy();
  });

  it('renders only 2 chars even for short symbols', () => {
    const { getByText } = render(<TickerAvatar symbol="GE" />);
    expect(getByText('GE')).toBeTruthy();
  });

  it('applies Technology sector colors', () => {
    const { getByTestId } = render(
      <TickerAvatar symbol="AAPL" sector="Technology" testID="avatar" />
    );
    const container = getByTestId('avatar');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#E6F1FB' }),
      ])
    );
  });

  it('applies ETF sector colors', () => {
    const { getByTestId } = render(
      <TickerAvatar symbol="SPY" sector="ETF" testID="avatar" />
    );
    const container = getByTestId('avatar');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#E1F5EE' }),
      ])
    );
  });

  it('applies default colors for unknown sector', () => {
    const { getByTestId } = render(
      <TickerAvatar symbol="XYZ" testID="avatar" />
    );
    const container = getByTestId('avatar');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#F7FAFC' }),
      ])
    );
  });
});
