import { create } from 'zustand';
import { Holding, Trade, TradeSide } from '../core/api/database.types';
import * as portfolioService from '../services/portfolioService';
import * as tradeService from '../services/tradeService';
import * as userService from '../services/userService';

interface PortfolioState {
  holdings: Holding[];
  trades: Trade[];
  cash: number | null;
  loading: boolean;
  error: string | null;
  fetchPortfolio: () => Promise<void>;
  fetchTrades: (side?: TradeSide) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  holdings: [],
  trades: [],
  cash: null,
  loading: false,
  error: null,
};

function toReadableError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  ...initialState,

  fetchPortfolio: async () => {
    set({ loading: true, error: null });

    try {
      const [holdings, cash] = await Promise.all([
        portfolioService.getHoldings(),
        userService.getBalance(),
      ]);

      set({ holdings, cash });
    } catch (error) {
      set({ error: toReadableError(error, 'Could not load portfolio') });
    } finally {
      set({ loading: false });
    }
  },

  fetchTrades: async (side) => {
    set({ loading: true, error: null });

    try {
      const trades = await tradeService.getTradeHistory(side);
      set({ trades });
    } catch (error) {
      set({ error: toReadableError(error, 'Could not load trades') });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
