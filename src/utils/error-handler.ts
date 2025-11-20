import { getLogger } from '../logger/logger';

/**
 * Exponential backoff retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 100,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = config;

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay for next retry with exponential backoff
      const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
      const actualDelay = Math.min(delay + jitter, maxDelayMs);

      getLogger().debug(`Retry attempt ${attempt + 1}/${maxRetries} after ${actualDelay}ms`, {
        error: lastError.message,
        attempt: attempt + 1,
        delay: actualDelay,
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, actualDelay));

      // Increase delay for next iteration
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  // All retries failed
  getLogger().error('All retry attempts failed', {
    maxRetries,
    lastError: lastError?.message,
  });

  throw lastError || new Error('Failed after all retries');
}

/**
 * Circuit breaker for handling cascading failures
 */
export class CircuitBreaker<T> {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private fn: () => Promise<T>,
    private config: {
      failureThreshold?: number;
      resetTimeoutMs?: number;
      onStateChange?: (newState: string) => void;
    } = {},
  ) {}

  async execute(): Promise<T> {
    const { failureThreshold = 5, resetTimeoutMs = 60000 } = this.config;

    // Check if circuit should be reset
    if (
      this.state === 'open' &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime > resetTimeoutMs
    ) {
      this.setState('half-open');
    }

    // If circuit is open, throw error immediately
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open - service temporarily unavailable');
    }

    try {
      const result = await this.fn();

      // Reset on success
      if (this.state === 'half-open') {
        this.setState('closed');
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= failureThreshold) {
        this.setState('open');
        getLogger().error('Circuit breaker opened due to repeated failures', {
          failureCount: this.failureCount,
          threshold: failureThreshold,
        });
      }

      throw error;
    }
  }

  private setState(newState: 'closed' | 'open' | 'half-open'): void {
    const oldState = this.state;
    this.state = newState;

    if (oldState !== newState) {
      getLogger().info(`Circuit breaker state changed: ${oldState} -> ${newState}`, {
        state: newState,
      });
      this.config.onStateChange?.(newState);
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Safe error handler for async operations
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: Error) => void,
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    errorHandler?.(err);
    getLogger().error('Error in async operation', { error: err.message });
    return null;
  }
}

/**
 * Graceful degradation handler
 */
export async function withGracefulDegradation<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  context?: { operation?: string; metadata?: Record<string, unknown> },
): Promise<T> {
  const operationName = context?.operation ?? 'Operation';

  try {
    return await primaryFn();
  } catch (primaryError) {
    getLogger().warn(`${operationName} primary operation failed, attempting fallback`, {
      ...context?.metadata,
      error: primaryError instanceof Error ? primaryError.message : String(primaryError),
    });

    try {
      return await fallbackFn();
    } catch (fallbackError) {
      getLogger().error(`${operationName} failed in both primary and fallback operations`, {
        ...context?.metadata,
        primaryError: primaryError instanceof Error ? primaryError.message : String(primaryError),
        fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      });
      throw fallbackError;
    }
  }
}
