import { SlidingWindowRateLimiter } from '../../../src/core/api/rateLimiter';

describe('SlidingWindowRateLimiter', () => {
  it('allows calls within limit', () => {
    let now = 1_000;
    const limiter = new SlidingWindowRateLimiter(2, 60_000, () => now);

    expect(limiter.allowRequest()).toBe(true);
    expect(limiter.allowRequest()).toBe(true);
  });

  it('blocks calls over limit', () => {
    let now = 1_000;
    const limiter = new SlidingWindowRateLimiter(2, 60_000, () => now);

    limiter.allowRequest();
    limiter.allowRequest();

    expect(limiter.allowRequest()).toBe(false);
  });

  it('resets after window expires', () => {
    let now = 1_000;
    const limiter = new SlidingWindowRateLimiter(2, 60_000, () => now);

    limiter.allowRequest();
    limiter.allowRequest();
    now = 61_000;

    expect(limiter.allowRequest()).toBe(true);
  });
});
