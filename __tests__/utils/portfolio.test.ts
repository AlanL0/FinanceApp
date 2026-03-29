import {
  computePortfolio,
  computeHoldingPL,
  STARTING_BALANCE,
  type Holding,
  type StockPrice,
} from '../../src/utils/portfolio';

describe('computePortfolio', () => {
  const holdings: Holding[] = [
    { symbol: 'AAPL', shares: 10, avgCost: 150 },
    { symbol: 'MSFT', shares: 5, avgCost: 300 },
  ];

  const prices: Record<string, StockPrice> = {
    AAPL: { price: 160, change: 1 },
    MSFT: { price: 310, change: -2 },
  };

  const cash = 50_000;

  it('computes total portfolio value correctly', () => {
    // invested = 10*160 + 5*310 = 1600 + 1550 = 3150
    // total = 50000 + 3150 = 53150
    const result = computePortfolio(holdings, prices, cash);
    expect(result.total).toBe(53_150);
  });

  it('computes invested value correctly', () => {
    const result = computePortfolio(holdings, prices, cash);
    expect(result.invested).toBe(3_150);
  });

  it('computes totalReturn against STARTING_BALANCE', () => {
    const result = computePortfolio(holdings, prices, cash);
    expect(result.totalReturn).toBe(53_150 - STARTING_BALANCE);
  });

  it('computes dayChange correctly', () => {
    // dayChange = 10*1 + 5*(-2) = 10 - 10 = 0
    const result = computePortfolio(holdings, prices, cash);
    expect(result.dayChange).toBe(0);
  });

  it('computes returnPct correctly', () => {
    const result = computePortfolio(holdings, prices, cash);
    const expected = ((53_150 - STARTING_BALANCE) / STARTING_BALANCE) * 100;
    expect(result.returnPct).toBeCloseTo(expected);
  });

  it('handles missing prices gracefully', () => {
    const result = computePortfolio(holdings, {}, cash);
    expect(result.invested).toBe(0);
    expect(result.total).toBe(cash);
  });
});

describe('computeHoldingPL', () => {
  it('computes P&L for a winning trade', () => {
    const holding: Holding = { symbol: 'AAPL', shares: 10, avgCost: 100 };
    const result = computeHoldingPL(holding, 110);
    expect(result.pl).toBe(100);
    expect(result.plPct).toBeCloseTo(10);
    expect(result.marketVal).toBe(1100);
  });

  it('computes P&L for a losing trade', () => {
    const holding: Holding = { symbol: 'AAPL', shares: 5, avgCost: 200 };
    const result = computeHoldingPL(holding, 180);
    expect(result.pl).toBe(-100);
    expect(result.plPct).toBeCloseTo(-10);
    expect(result.marketVal).toBe(900);
  });
});
