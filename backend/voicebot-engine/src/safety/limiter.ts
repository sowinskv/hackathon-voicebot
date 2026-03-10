/**
 * Rate limiting and conversation limits
 */

interface LimitConfig {
  maxDuration: number; // Maximum conversation duration in milliseconds
  maxRetries: number; // Maximum retry attempts for failed slots
  maxTurns: number; // Maximum conversation turns
  rateLimitWindow: number; // Time window for rate limiting
  rateLimitMax: number; // Max requests in window
}

const DEFAULT_CONFIG: LimitConfig = {
  maxDuration: 10 * 60 * 1000, // 10 minutes
  maxRetries: 3,
  maxTurns: 50,
  rateLimitWindow: 60 * 1000, // 1 minute
  rateLimitMax: 20, // 20 requests per minute
};

export class RateLimiter {
  private sessionId: string;
  private config: LimitConfig;
  private startTime: Date;
  private turnCount: number = 0;
  private retries: Map<string, number> = new Map(); // Track retries per slot
  private requestTimestamps: number[] = [];

  constructor(sessionId: string, config: Partial<LimitConfig> = {}) {
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = new Date();
  }

  /**
   * Check if the rate limit has been exceeded
   */
  checkLimit(): boolean {
    const now = Date.now();

    // Remove timestamps outside the window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.config.rateLimitWindow
    );

    // Check if limit exceeded
    if (this.requestTimestamps.length >= this.config.rateLimitMax) {
      console.warn(`Rate limit exceeded for session ${this.sessionId}`);
      return false;
    }

    // Record this request
    this.requestTimestamps.push(now);
    return true;
  }

  /**
   * Check if maximum conversation duration has been exceeded
   */
  checkDuration(): boolean {
    const elapsed = Date.now() - this.startTime.getTime();
    return elapsed <= this.config.maxDuration;
  }

  /**
   * Increment turn count and check if max turns exceeded
   */
  incrementTurn(): boolean {
    this.turnCount++;
    return this.turnCount <= this.config.maxTurns;
  }

  /**
   * Record a retry attempt for a specific slot
   */
  recordRetry(slotName: string): boolean {
    const currentRetries = this.retries.get(slotName) || 0;
    const newRetries = currentRetries + 1;

    this.retries.set(slotName, newRetries);

    if (newRetries >= this.config.maxRetries) {
      console.warn(`Max retries reached for slot ${slotName} in session ${this.sessionId}`);
      return false;
    }

    return true;
  }

  /**
   * Reset retry count for a slot (when successfully filled)
   */
  resetRetries(slotName: string): void {
    this.retries.delete(slotName);
  }

  /**
   * Get current retry count for a slot
   */
  getRetryCount(slotName: string): number {
    return this.retries.get(slotName) || 0;
  }

  /**
   * Get remaining time in conversation
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.startTime.getTime();
    const remaining = this.config.maxDuration - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Get remaining turns
   */
  getRemainingTurns(): number {
    return Math.max(0, this.config.maxTurns - this.turnCount);
  }

  /**
   * Get session statistics
   */
  getStats(): {
    sessionId: string;
    elapsedTime: number;
    remainingTime: number;
    turnCount: number;
    remainingTurns: number;
    retries: Record<string, number>;
    requestRate: number;
  } {
    const elapsed = Date.now() - this.startTime.getTime();
    const recentRequests = this.requestTimestamps.filter(
      timestamp => Date.now() - timestamp < this.config.rateLimitWindow
    ).length;

    return {
      sessionId: this.sessionId,
      elapsedTime: elapsed,
      remainingTime: this.getRemainingTime(),
      turnCount: this.turnCount,
      remainingTurns: this.getRemainingTurns(),
      retries: Object.fromEntries(this.retries),
      requestRate: recentRequests,
    };
  }

  /**
   * Check all limits at once
   */
  checkAllLimits(): {
    allowed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    if (!this.checkLimit()) {
      violations.push('rate_limit_exceeded');
    }

    if (!this.checkDuration()) {
      violations.push('max_duration_exceeded');
    }

    if (this.turnCount >= this.config.maxTurns) {
      violations.push('max_turns_exceeded');
    }

    return {
      allowed: violations.length === 0,
      violations,
    };
  }

  /**
   * Should warn user about approaching limits
   */
  shouldWarnUser(): {
    warn: boolean;
    message?: string;
  } {
    const remainingTime = this.getRemainingTime();
    const remainingTurns = this.getRemainingTurns();

    // Warn when 2 minutes remaining
    if (remainingTime > 0 && remainingTime < 2 * 60 * 1000) {
      return {
        warn: true,
        message: 'We have about 2 minutes left in our conversation. Let\'s make sure we collect all the necessary information.',
      };
    }

    // Warn when 5 turns remaining
    if (remainingTurns > 0 && remainingTurns <= 5) {
      return {
        warn: true,
        message: 'We\'re approaching the end of our conversation. Let me make sure I have everything I need.',
      };
    }

    return { warn: false };
  }
}

/**
 * Global rate limiter for the entire service
 */
export class GlobalRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests: number = 1000, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(identifier: string = 'global'): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];

    // Remove old timestamps
    const recent = timestamps.filter(t => now - t < this.windowMs);

    if (recent.length >= this.maxRequests) {
      return false;
    }

    recent.push(now);
    this.requests.set(identifier, recent);

    return true;
  }

  getUsage(identifier: string = 'global'): {
    current: number;
    max: number;
    percentage: number;
  } {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const recent = timestamps.filter(t => now - t < this.windowMs);

    return {
      current: recent.length,
      max: this.maxRequests,
      percentage: (recent.length / this.maxRequests) * 100,
    };
  }

  reset(identifier: string = 'global'): void {
    this.requests.delete(identifier);
  }
}
