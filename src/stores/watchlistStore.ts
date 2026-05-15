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
  reorderSymbol: (symbol: string, direction: 'up' | 'down') => void;
  moveSymbolToIndex: (symbol: string, targetIndex: number) => void;
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

function reorderItems(items: WatchlistItem[], fromIndex: number, toIndex: number): WatchlistItem[] {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
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

  reorderSymbol: (symbol, direction) => {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const items = get().items;
    const fromIndex = items.findIndex((item) => item.symbol === normalizedSymbol);

    if (fromIndex < 0) {
      return;
    }

    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    get().moveSymbolToIndex(normalizedSymbol, toIndex);
  },

  moveSymbolToIndex: (symbol, targetIndex) => {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const items = get().items;
    const fromIndex = items.findIndex((item) => item.symbol === normalizedSymbol);

    if (fromIndex < 0 || items.length < 2) {
      return;
    }

    const toIndex = clampIndex(targetIndex, items.length);

    if (fromIndex === toIndex) {
      return;
    }

    const nextItems = reorderItems(items, fromIndex, toIndex);
    set({ items: nextItems, symbols: symbolsFromItems(nextItems) });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
