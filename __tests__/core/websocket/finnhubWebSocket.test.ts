import {
  FinnhubLiveTrade,
  FinnhubSocketLike,
  FinnhubSocketMessageEvent,
  FinnhubWebSocketManager,
  MAX_FINNHUB_SUBSCRIPTIONS,
} from '../../../src/core/websocket/finnhubWebSocket';

class FakeSocket implements FinnhubSocketLike {
  onopen: ((event: unknown) => void) | null = null;
  onmessage: ((event: FinnhubSocketMessageEvent) => void) | null = null;
  onclose: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  sent: string[] = [];
  closed = false;

  constructor(readonly url: string) {}

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
  }

  open(): void {
    this.onopen?.({});
  }

  message(data: string): void {
    this.onmessage?.({ data });
  }

  closeFromServer(): void {
    this.onclose?.({});
  }

  error(message = 'Socket failed'): void {
    this.onerror?.({ message });
  }
}

function makeManager(options: {
  onTrade?: (trade: FinnhubLiveTrade) => void;
  onStateChange?: jest.Mock;
} = {}) {
  const sockets: FakeSocket[] = [];
  const manager = new FinnhubWebSocketManager({
    token: 'test-token',
    webSocketFactory: (url) => {
      const socket = new FakeSocket(url);
      sockets.push(socket);
      return socket;
    },
    onTrade: options.onTrade,
    onStateChange: options.onStateChange,
  });

  return { manager, sockets };
}

describe('FinnhubWebSocketManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('connects with the Finnhub token and subscribes normalized symbols', () => {
    const onStateChange = jest.fn();
    const { manager, sockets } = makeManager({ onStateChange });

    manager.subscribe([' aapl ', 'MSFT', 'aapl']);
    manager.connect();
    sockets[0].open();

    expect(sockets[0].url).toBe('wss://ws.finnhub.io?token=test-token');
    expect(sockets[0].sent).toEqual([
      JSON.stringify({ type: 'subscribe', symbol: 'AAPL' }),
      JSON.stringify({ type: 'subscribe', symbol: 'MSFT' }),
    ]);
    expect(onStateChange).toHaveBeenCalledWith({ connected: true, connecting: false, error: null });
  });

  it('unsubscribes active symbols', () => {
    const { manager, sockets } = makeManager();

    manager.connect();
    sockets[0].open();
    manager.subscribe(['AAPL', 'MSFT']);
    manager.unsubscribe(' msft ');

    expect(sockets[0].sent).toContain(JSON.stringify({ type: 'unsubscribe', symbol: 'MSFT' }));
    expect(manager.getActiveSymbols()).toEqual(['AAPL']);
  });

  it('queues subscriptions until the socket opens', () => {
    const { manager, sockets } = makeManager();

    manager.connect();
    manager.subscribe('AAPL');

    expect(sockets[0].sent).toEqual([]);

    sockets[0].open();
    expect(sockets[0].sent).toEqual([
      JSON.stringify({ type: 'subscribe', symbol: 'AAPL' }),
    ]);
  });

  it('enforces the active subscription cap', () => {
    const { manager } = makeManager();
    const symbols = Array.from({ length: MAX_FINNHUB_SUBSCRIPTIONS + 5 }, (_, index) => `T${index}`);

    manager.subscribe(symbols);

    expect(manager.getActiveSymbols()).toHaveLength(MAX_FINNHUB_SUBSCRIPTIONS);
  });

  it('parses trade messages into live trades', () => {
    const onTrade = jest.fn();
    const { manager, sockets } = makeManager({ onTrade });

    manager.connect();
    sockets[0].open();
    sockets[0].message(JSON.stringify({
      type: 'trade',
      data: [{ s: 'aapl', p: 185.5, t: 1_000 }],
    }));

    expect(onTrade).toHaveBeenCalledWith({ symbol: 'AAPL', price: 185.5, timestamp: 1_000 });
  });

  it('ignores malformed and non-trade messages', () => {
    const onTrade = jest.fn();
    const { manager, sockets } = makeManager({ onTrade });

    manager.connect();
    sockets[0].open();
    sockets[0].message('not-json');
    sockets[0].message(JSON.stringify({ type: 'ping' }));
    sockets[0].message(JSON.stringify({ type: 'trade', data: [{ s: 'AAPL' }] }));

    expect(onTrade).not.toHaveBeenCalled();
  });

  it('reconnects with backoff and resubscribes active symbols', () => {
    const { manager, sockets } = makeManager();

    manager.connect();
    sockets[0].open();
    manager.subscribe('AAPL');
    sockets[0].closeFromServer();

    jest.advanceTimersByTime(1_000);
    expect(sockets).toHaveLength(2);

    sockets[1].open();
    expect(sockets[1].sent).toEqual([
      JSON.stringify({ type: 'subscribe', symbol: 'AAPL' }),
    ]);
  });

  it('does not reconnect after manual disconnect', () => {
    const { manager, sockets } = makeManager();

    manager.connect();
    sockets[0].open();
    manager.subscribe('AAPL');
    manager.disconnect();
    sockets[0].closeFromServer();
    jest.advanceTimersByTime(30_000);

    expect(sockets).toHaveLength(1);
    expect(sockets[0].closed).toBe(true);
    expect(manager.getActiveSymbols()).toEqual([]);
  });

  it('emits readable socket errors', () => {
    const onStateChange = jest.fn();
    const { manager, sockets } = makeManager({ onStateChange });

    manager.connect();
    sockets[0].error('Nope');

    expect(onStateChange).toHaveBeenCalledWith({ connected: false, connecting: false, error: 'Nope' });
  });
});
