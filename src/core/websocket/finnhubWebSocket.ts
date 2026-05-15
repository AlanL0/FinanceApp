import { FINNHUB_API_KEY } from '@env';

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';
export const MAX_FINNHUB_SUBSCRIPTIONS = 50;

const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];

export interface FinnhubLiveTrade {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface FinnhubConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export interface FinnhubSocketMessageEvent {
  data: string;
}

export interface FinnhubSocketLike {
  onopen: ((event: unknown) => void) | null;
  onmessage: ((event: FinnhubSocketMessageEvent) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  send: (data: string) => void;
  close: () => void;
}

export type FinnhubWebSocketFactory = (url: string) => FinnhubSocketLike;

interface FinnhubWebSocketManagerOptions {
  token?: string;
  webSocketFactory?: FinnhubWebSocketFactory;
  onTrade?: (trade: FinnhubLiveTrade) => void;
  onStateChange?: (state: FinnhubConnectionState) => void;
  setTimeoutFn?: (handler: () => void, timeout: number) => ReturnType<typeof setTimeout>;
  clearTimeoutFn?: (timeoutId: ReturnType<typeof setTimeout>) => void;
}

interface FinnhubTradePayload {
  s?: unknown;
  p?: unknown;
  t?: unknown;
}

interface FinnhubTradeMessage {
  type?: unknown;
  data?: unknown;
}

function defaultWebSocketFactory(url: string): FinnhubSocketLike {
  return new WebSocket(url) as unknown as FinnhubSocketLike;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function readableSocketError(event: unknown): string {
  if (event instanceof Error && event.message.trim()) {
    return event.message;
  }

  if (
    typeof event === 'object' &&
    event !== null &&
    'message' in event &&
    typeof event.message === 'string' &&
    event.message.trim()
  ) {
    return event.message;
  }

  return 'Finnhub WebSocket error';
}

function parseTradeMessage(rawData: string): FinnhubLiveTrade[] {
  let parsedMessage: unknown;

  try {
    parsedMessage = JSON.parse(rawData);
  } catch {
    return [];
  }

  const message = parsedMessage as FinnhubTradeMessage;

  if (message.type !== 'trade' || !Array.isArray(message.data)) {
    return [];
  }

  return message.data
    .map((payload: FinnhubTradePayload) => {
      if (typeof payload.s !== 'string' || typeof payload.p !== 'number') {
        return null;
      }

      return {
        symbol: normalizeSymbol(payload.s),
        price: payload.p,
        timestamp: typeof payload.t === 'number' ? payload.t : Date.now(),
      };
    })
    .filter((trade): trade is FinnhubLiveTrade => trade !== null);
}

export class FinnhubWebSocketManager {
  private readonly token: string;
  private readonly webSocketFactory: FinnhubWebSocketFactory;
  private readonly onTrade: (trade: FinnhubLiveTrade) => void;
  private readonly onStateChange: (state: FinnhubConnectionState) => void;
  private readonly setTimeoutFn: (handler: () => void, timeout: number) => ReturnType<typeof setTimeout>;
  private readonly clearTimeoutFn: (timeoutId: ReturnType<typeof setTimeout>) => void;
  private socket: FinnhubSocketLike | null = null;
  private socketOpen = false;
  private activeSymbols = new Set<string>();
  private manuallyClosed = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: FinnhubWebSocketManagerOptions = {}) {
    this.token = options.token ?? FINNHUB_API_KEY ?? '';
    this.webSocketFactory = options.webSocketFactory ?? defaultWebSocketFactory;
    this.onTrade = options.onTrade ?? (() => {});
    this.onStateChange = options.onStateChange ?? (() => {});
    this.setTimeoutFn = options.setTimeoutFn ?? setTimeout;
    this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;
  }

  connect(): void {
    if (this.socket) {
      return;
    }

    if (!this.token) {
      this.emitState({ connected: false, connecting: false, error: 'Finnhub API key is missing' });
      return;
    }

    this.manuallyClosed = false;
    this.emitState({ connected: false, connecting: true, error: null });
    const socket = this.webSocketFactory(`${FINNHUB_WS_URL}?token=${this.token}`);
    this.socket = socket;

    socket.onopen = () => {
      this.socketOpen = true;
      this.reconnectAttempt = 0;
      this.emitState({ connected: true, connecting: false, error: null });
      this.activeSymbols.forEach((symbol) => {
        this.sendSubscription('subscribe', symbol);
      });
    };

    socket.onmessage = (event) => {
      parseTradeMessage(event.data).forEach((trade) => {
        this.onTrade(trade);
      });
    };

    socket.onerror = (event) => {
      this.emitState({ connected: false, connecting: false, error: readableSocketError(event) });
    };

    socket.onclose = () => {
      if (this.socket === socket) {
        this.socket = null;
      }

      this.socketOpen = false;
      this.emitState({ connected: false, connecting: false, error: null });

      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.clearReconnectTimer();
    this.activeSymbols.clear();

    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      this.socketOpen = false;
      socket.close();
    }

    this.emitState({ connected: false, connecting: false, error: null });
  }

  subscribe(symbols: string | string[]): void {
    const normalizedSymbols = this.normalizeSymbols(symbols);

    normalizedSymbols.forEach((symbol) => {
      if (this.activeSymbols.size >= MAX_FINNHUB_SUBSCRIPTIONS || this.activeSymbols.has(symbol)) {
        return;
      }

      this.activeSymbols.add(symbol);
      this.sendSubscription('subscribe', symbol);
    });
  }

  unsubscribe(symbols: string | string[]): void {
    const normalizedSymbols = this.normalizeSymbols(symbols);

    normalizedSymbols.forEach((symbol) => {
      if (!this.activeSymbols.delete(symbol)) {
        return;
      }

      this.sendSubscription('unsubscribe', symbol);
    });
  }

  getActiveSymbols(): string[] {
    return Array.from(this.activeSymbols);
  }

  private normalizeSymbols(symbols: string | string[]): string[] {
    const list = Array.isArray(symbols) ? symbols : [symbols];

    return Array.from(new Set(
      list
        .map(normalizeSymbol)
        .filter((symbol) => symbol.length > 0),
    ));
  }

  private sendSubscription(type: 'subscribe' | 'unsubscribe', symbol: string): void {
    if (!this.socket || !this.socketOpen) {
      return;
    }

    this.socket.send(JSON.stringify({ type, symbol }));
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    this.reconnectAttempt += 1;
    this.emitState({ connected: false, connecting: true, error: null });
    this.reconnectTimer = this.setTimeoutFn(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    this.clearTimeoutFn(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private emitState(state: FinnhubConnectionState): void {
    this.onStateChange(state);
  }
}
