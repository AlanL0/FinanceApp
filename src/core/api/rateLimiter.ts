export class FinnhubRateLimitError extends Error {
  constructor(message = 'Finnhub rate limit exceeded') {
    super(message);
    this.name = 'FinnhubRateLimitError';
  }
}

export class SlidingWindowRateLimiter {
  private readonly timestamps: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    private readonly getNow: () => number = Date.now,
  ) {}

  allowRequest(): boolean {
    const now = this.getNow();
    this.prune(now);

    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  reset(): void {
    this.timestamps.length = 0;
  }

  private prune(now: number): void {
    while (this.timestamps.length > 0 && now - this.timestamps[0] >= this.windowMs) {
      this.timestamps.shift();
    }
  }
}

export const finnhubRateLimiter = new SlidingWindowRateLimiter(60, 60_000);

export function assertFinnhubRateLimit(): void {
  if (!finnhubRateLimiter.allowRequest()) {
    throw new FinnhubRateLimitError();
  }
}
