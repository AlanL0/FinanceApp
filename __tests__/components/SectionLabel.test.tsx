import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SectionLabel } from '../../src/components/SectionLabel';

describe('SectionLabel', () => {
  it('renders the title', () => {
    const { getByText } = render(<SectionLabel title="Watchlist" />);
    expect(getByText('Watchlist')).toBeTruthy();
  });

  it('renders the action text when provided', () => {
    const { getByText } = render(
      <SectionLabel title="Watchlist" action="See all →" onAction={() => {}} />
    );
    expect(getByText('See all →')).toBeTruthy();
  });

  it('does not render action text when not provided', () => {
    const { queryByText } = render(<SectionLabel title="Watchlist" />);
    expect(queryByText('See all →')).toBeNull();
  });

  it('calls onAction when the action is tapped', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <SectionLabel title="Watchlist" action="See all →" onAction={onAction} />
    );
    fireEvent.press(getByText('See all →'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
