import { create } from 'zustand';
import {
  FinnhubConnectionState,
  FinnhubLiveTrade,
  FinnhubWebSocketManager,
  MAX_FINNHUB_SUBSCRIPTIONS,
} from '../core/websocket/finnhubWebSocket';

export interface LivePrice {
  symbol: string;
  price: number;
  timestamp: number;
  previousPrice?: number;
  change?: number;
  changePercent?: number;
}

export interface PriceWebSocketManager {
  connect: () => void;
  disconnect: () => void;
  subscribe: (symbols: string | string[]) => void;
  unsubscribe: (symbols: string | string[]) => void;
}

interface PriceState {
  pricesBySymbol: Record<string, LivePrice>;
  activeSymbols: string[];
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (symbols: string | string[]) => void;
  unsubscribe: (symbols: string | string[]) => void;
  updatePrice: (symbol: string, price: number, timestamp?: number) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  pricesBySymbol: {},
  activeSymbols: [],
  connected: false,
  connecting: false,
  error: null,
};

let priceWebSocketManager: PriceWebSocketManager | null = null;

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function normalizeSymbols(symbols: string | string[]): string[] {
  const list = Array.isArray(symbols) ? symbols : [symbols];

  return Array.from(new Set(
    list
      .map(normalizeSymbol)
      .filter((symbol) => symbol.length > 0),
  ));
}

function applyConnectionState(state: FinnhubConnectionState): void {
  usePriceStore.setState({
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
  });
}

function applyTrade(trade: FinnhubLiveTrade): void {
  usePriceStore.getState().updatePrice(trade.symbol, trade.price, trade.timestamp);
}

function getPriceWebSocketManager(): PriceWebSocketManager {
  if (!priceWebSocketManager) {
    priceWebSocketManager = new FinnhubWebSocketManager({
      onTrade: applyTrade,
      onStateChange: applyConnectionState,
    });
  }

  return priceWebSocketManager;
}

export function setPriceWebSocketManager(manager: PriceWebSocketManager | null): void {
  priceWebSocketManager = manager;
}

export const usePriceStore = create<PriceState>((set, get) => ({
  ...initialState,

  connect: () => {
    getPriceWebSocketManager().connect();
  },

  disconnect: () => {
    getPriceWebSocketManager().disconnect();
    set({
      connected: false,
      connecting: false,
      activeSymbols: [],
    });
  },

  subscribe: (symbols) => {
    const normalizedSymbols = normalizeSymbols(symbols);
    const currentSymbols = get().activeSymbols;
    const nextSymbols = [...currentSymbols];

    normalizedSymbols.forEach((symbol) => {
      if (nextSymbols.length >= MAX_FINNHUB_SUBSCRIPTIONS || nextSymbols.includes(symbol)) {
        return;
      }

      nextSymbols.push(symbol);
    });

    const addedSymbols = nextSymbols.filter((symbol) => !currentSymbols.includes(symbol));

    if (addedSymbols.length > 0) {
      getPriceWebSocketManager().subscribe(addedSymbols);
      set({ activeSymbols: nextSymbols });
    }
  },

  unsubscribe: (symbols) => {
    const normalizedSymbols = normalizeSymbols(symbols);
    const removedSymbols = get().activeSymbols.filter((symbol) => normalizedSymbols.includes(symbol));

    if (removedSymbols.length === 0) {
      return;
    }

    getPriceWebSocketManager().unsubscribe(removedSymbols);
    set({
      activeSymbols: get().activeSymbols.filter((symbol) => !normalizedSymbols.includes(symbol)),
    });
  },

  updatePrice: (symbol, price, timestamp = Date.now()) => {
    const normalizedSymbol = normalizeSymbol(symbol);
    const previousPrice = get().pricesBySymbol[normalizedSymbol]?.price;
    const change = previousPrice === undefined ? undefined : price - previousPrice;
    const changePercent = previousPrice && previousPrice !== 0 && change !== undefined
      ? (change / previousPrice) * 100
      : undefined;

    set((state) => ({
      pricesBySymbol: {
        ...state.pricesBySymbol,
        [normalizedSymbol]: {
          symbol: normalizedSymbol,
          price,
          timestamp,
          previousPrice,
          ...(change !== undefined ? { change } : {}),
          ...(changePercent !== undefined ? { changePercent } : {}),
        },
      },
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
