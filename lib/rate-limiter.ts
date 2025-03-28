import { EventEmitter } from "events";

export interface RateLimiterOptions {
  requestsPerSecond: number;
  burstSize: number;
  maxRetries: number;
}

export interface RateLimiterConfig {
  maxTokens: number;
  refillRate: number;
  refillInterval: number;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly tokensPerSecond: number;
  private readonly maxRetries: number;
  private readonly eventEmitter: EventEmitter;

  constructor(options: RateLimiterOptions) {
    this.tokens = options.burstSize;
    this.maxTokens = options.burstSize;
    this.tokensPerSecond = options.requestsPerSecond;
    this.maxRetries = options.maxRetries;
    this.lastRefill = Date.now();
    this.eventEmitter = new EventEmitter();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const newTokens = timePassed * this.tokensPerSecond;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  public async acquire(retryCount: number = 0): Promise<void> {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    if (retryCount >= this.maxRetries) {
      return Promise.reject(
        new Error("Rate limit exceeded: Max retries reached"),
      );
    }

    // Calculate wait time based on tokens needed
    const waitTime = ((1 - this.tokens) / this.tokensPerSecond) * 1000;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.acquire(retryCount + 1)
          .then(resolve)
          .catch(reject);
      }, waitTime);
    });
  }

  public getTokens(): number {
    this.refillTokens();
    return this.tokens;
  }
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const refillAmount = Math.floor(
      (timePassed * this.config.refillRate) / this.config.refillInterval,
    );
    this.tokens = Math.min(this.config.maxTokens, this.tokens + refillAmount);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.tokens <= 0) {
      const waitTime = this.config.refillInterval / this.config.refillRate;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.refillTokens();
    }

    this.tokens--;
  }
}
