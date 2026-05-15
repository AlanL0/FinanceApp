import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CompanyLogo } from '../../../src/features/stocks/components/CompanyLogo';

describe('CompanyLogo', () => {
  it('renders a remote logo image when a URL is available', () => {
    const { getByTestId } = render(
      <CompanyLogo symbol="AAPL" logoUrl="https://static.finnhub.io/logo/aapl.png" />
    );

    expect(getByTestId('company-logo')).toBeTruthy();
    expect(getByTestId('company-logo-image')).toBeTruthy();
  });

  it('falls back to ticker initials without a logo URL', () => {
    const { getByTestId, getByText } = render(<CompanyLogo symbol="MSFT" />);

    expect(getByTestId('company-logo-fallback')).toBeTruthy();
    expect(getByText('MS')).toBeTruthy();
  });

  it('falls back to ticker initials if the image fails to load', () => {
    const { getByTestId, getByText } = render(
      <CompanyLogo symbol="NVDA" logoUrl="https://static.finnhub.io/logo/nvda.png" />
    );

    fireEvent(getByTestId('company-logo-image'), 'error');

    expect(getByTestId('company-logo-fallback')).toBeTruthy();
    expect(getByText('NV')).toBeTruthy();
  });
});
