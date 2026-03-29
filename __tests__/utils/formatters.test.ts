import { fmt, isPositive, priceColor } from '../../src/utils/formatters';

describe('fmt.currency', () => {
  it('formats a number with commas and 2 decimal places', () => {
    expect(fmt.currency(1234.5)).toBe('$1,234.50');
  });

  it('formats zero correctly', () => {
    expect(fmt.currency(0)).toBe('$0.00');
  });

  it('formats a simple number', () => {
    expect(fmt.currency(150)).toBe('$150.00');
  });
});

describe('fmt.currencyCompact', () => {
  it('formats thousands with k suffix', () => {
    expect(fmt.currencyCompact(1500)).toBe('$1.5k');
  });
});

describe('fmt.pct', () => {
  it('prefixes positive values with +', () => {
    expect(fmt.pct(2.5)).toBe('+2.50%');
  });

  it('does not double-prefix negative values', () => {
    expect(fmt.pct(-1.3)).toBe('-1.30%');
  });

  it('formats zero as +0.00%', () => {
    expect(fmt.pct(0)).toBe('+0.00%');
  });
});

describe('fmt.signed', () => {
  it('prefixes positive values with +$', () => {
    expect(fmt.signed(150)).toBe('+$150.00');
  });

  it('formats negative values correctly', () => {
    expect(fmt.signed(-50)).toBe('-$50.00');
  });
});

describe('isPositive', () => {
  it('returns true for positive numbers', () => {
    expect(isPositive(1)).toBe(true);
  });

  it('returns true for zero', () => {
    expect(isPositive(0)).toBe(true);
  });

  it('returns false for negative numbers', () => {
    expect(isPositive(-1)).toBe(false);
  });
});

describe('priceColor', () => {
  it('returns the positive (teal) color for gains', () => {
    expect(priceColor(1)).toBe('#1D9E75');
  });

  it('returns the negative (red) color for losses', () => {
    expect(priceColor(-1)).toBe('#E24B4A');
  });
});
