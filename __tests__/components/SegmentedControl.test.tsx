import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SegmentedControl } from '../../src/components/SegmentedControl';

const OPTIONS = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
];

describe('SegmentedControl', () => {
  it('renders all option labels', () => {
    const { getByText } = render(
      <SegmentedControl options={OPTIONS} selected="1D" onSelect={() => {}} />
    );
    expect(getByText('1D')).toBeTruthy();
    expect(getByText('1W')).toBeTruthy();
    expect(getByText('1M')).toBeTruthy();
  });

  it('highlights the selected option', () => {
    const { getByTestId } = render(
      <SegmentedControl options={OPTIONS} selected="1W" onSelect={() => {}} />
    );
    const activeItem = getByTestId('segment-1W');
    expect(activeItem.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: expect.any(String) })])
    );
  });

  it('calls onSelect with the correct value when tapped', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <SegmentedControl options={OPTIONS} selected="1D" onSelect={onSelect} />
    );
    fireEvent.press(getByText('1M'));
    expect(onSelect).toHaveBeenCalledWith('1M');
  });

  it('calls onSelect when pressing the already-selected option', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <SegmentedControl options={OPTIONS} selected="1D" onSelect={onSelect} />
    );
    fireEvent.press(getByText('1D'));
    expect(onSelect).toHaveBeenCalledWith('1D');
  });
});
