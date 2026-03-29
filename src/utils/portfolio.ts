export const STARTING_BALANCE = 100_000;

export interface Holding {
  symbol: string;
  shares: number;
  avgCost: number;
}

export interface StockPrice {
  price: number;
  change: number;
}

export function computePortfolio(
  holdings: Holding[],
  prices: Record<string, StockPrice>,
  cash: number
) {
  const invested = holdings.reduce(
    (sum, h) => sum + h.shares * (prices[h.symbol]?.price || 0),
    0
  );
  const total = cash + invested;
  const totalReturn = total - STARTING_BALANCE;
  const dayChange = holdings.reduce(
    (sum, h) => sum + h.shares * (prices[h.symbol]?.change || 0),
    0
  );
  return {
    total,
    invested,
    totalReturn,
    dayChange,
    returnPct: (totalReturn / STARTING_BALANCE) * 100,
  };
}

export function computeHoldingPL(holding: Holding, currentPrice: number) {
  const pl = (currentPrice - holding.avgCost) * holding.shares;
  const plPct = ((currentPrice - holding.avgCost) / holding.avgCost) * 100;
  const marketVal = holding.shares * currentPrice;
  return { pl, plPct, marketVal };
}
