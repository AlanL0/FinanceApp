export const fmt = {
  currency: (n: number): string =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  currencyCompact: (n: number): string =>
    `$${(n / 1000).toFixed(1)}k`,
  currencyWhole: (n: number): string =>
    `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
  pct: (n: number): string =>
    `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`,
  signed: (n: number): string =>
    `${n >= 0 ? '+' : '-'}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
};

export const isPositive = (n: number): boolean => n >= 0;

export const priceColor = (change: number): string =>
  isPositive(change) ? '#1D9E75' : '#E24B4A';
