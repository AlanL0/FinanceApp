import { create } from 'zustand';
import { WatchlistItem } from '../core/api/database.types';
import * as watchlistService from '../services/watchlistService';

interface WatchlistState {
  items: WatchlistItem[];
  symbols: string[];
  loading: boolean;
  error: string | null;
  fetchWatchlist: () => Promise<void>;
  addSymbol: (symbol: string) => Promise<void>;
  removeSymbol: (symbol: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  items: [],
  symbols: [],
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

function symbolsFromItems(items: WatchlistItem[]): string[] {
  return items.map((item) => item.symbol);
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  ...initialState,

  fetchWatchlist: async () => {
    set({ loading: true, error: null });

    try {
      const items = await watchlistService.getWatchlist();
      set({ items, symbols: symbolsFromItems(items) });
    } catch (error) {
      set({ error: toReadableError(error, 'Could not load watchlist') });
    } finally {
      set({ loading: false });
    }
  },

  addSymbol: async (symbol) => {
    set({ loading: true, error: null });

    try {
      const item = await watchlistService.addSymbol(symbol);
      const items = [...get().items, item];
      set({ items, symbols: symbolsFromItems(items) });
    } catch (error) {
      set({ error: toReadableError(error, 'Could not add symbol') });
    } finally {
      set({ loading: false });
    }
  },

  removeSymbol: async (symbol) => {
    set({ loading: true, error: null });

    try {
      await watchlistService.removeSymbol(symbol);
      const normalizedSymbol = symbol.trim().toUpperCase();
      const items = get().items.filter((item) => item.symbol !== normalizedSymbol);
      set({ items, symbols: symbolsFromItems(items) });
    } catch (error) {
      set({ error: toReadableError(error, 'Could not remove symbol') });
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
