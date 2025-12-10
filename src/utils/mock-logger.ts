/**
 * Mock Logger for Testing
 * Provides a complete mock implementation of the ILogger interface for Jest/Vitest
 */

import type { LogContext } from '../context/async-context';
import type { ILogger } from '../logger/logger.interface';

/**
 * Mock log call record for inspection
 */
export type MockLogCall = {
  level: string;
  message: string;
  meta?: unknown;
  error?: Error;
  timestamp: number;
  context?: Partial<LogContext>;
};

/**
 * Mock logger implementation for testing
 * Captures all log calls and provides inspection methods
 */
export class MockLogger implements ILogger {
  private _calls: MockLogCall[] = [];
  private _currentContext: Partial<LogContext> = {};
  private _childMetadata: Record<string, unknown> = {};

  /**
   * Get all captured log calls
   */
  get calls(): readonly MockLogCall[] {
    return [...this._calls];
  }

  /**
   * Clear all captured log calls
   */
  clear(): void {
    this._calls = [];
  }

  /**
   * Get calls for a specific log level
   */
  getCallsByLevel(level: string): MockLogCall[] {
    return this._calls.filter((call) => call.level === level);
  }

  /**
   * Get the last log call
   */
  getLastCall(): MockLogCall | undefined {
    return this._calls[this._calls.length - 1];
  }

  /**
   * Check if any logs were made at a specific level
   */
  hasLogs(level?: string): boolean {
    if (level) {
      return this._calls.some((call) => call.level === level);
    }
    return this._calls.length > 0;
  }

  /**
   * Find calls containing specific text in message
   */
  findCallsByMessage(text: string): MockLogCall[] {
    return this._calls.filter((call) => call.message.toLowerCase().includes(text.toLowerCase()));
  }

  // ILogger interface implementation

  error(message: string, meta?: unknown, error?: Error): void {
    this._log('error', message, meta, error);
  }

  warn(message: string, meta?: unknown): void {
    this._log('warn', message, meta);
  }

  info(message: string, meta?: unknown): void {
    this._log('info', message, meta);
  }

  http(message: string, meta?: unknown): void {
    this._log('http', message, meta);
  }

  debug(message: string, meta?: unknown): void {
    this._log('debug', message, meta);
  }

  async close(): Promise<void> {
    // Mock implementation - no cleanup needed
    await Promise.resolve();
  }

  withContext<T>(context: Partial<LogContext>, function_: () => T | Promise<T>): T | Promise<T> {
    const previousContext = this._currentContext;
    this._currentContext = { ...this._currentContext, ...context };

    try {
      const result = function_();

      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          this._currentContext = previousContext;
        });
      } else {
        this._currentContext = previousContext;
        return result;
      }
    } catch (error) {
      this._currentContext = previousContext;
      throw error;
    }
  }

  child(metadata: Record<string, unknown>): ILogger {
    const childLogger = new MockLogger();
    childLogger._childMetadata = { ...this._childMetadata, ...metadata };
    childLogger._currentContext = { ...this._currentContext };
    return childLogger;
  }

  private _log(level: string, message: string, meta?: unknown, error?: Error): void {
    const call: MockLogCall = {
      level,
      message,
      timestamp: Date.now(),
      context: { ...this._currentContext },
    };

    if (meta !== undefined) {
      call.meta = { ...this._childMetadata, ...meta };
    }

    if (error) {
      call.error = error;
    }

    this._calls.push(call);
  }
}

/**
 * Create a new mock logger instance
 */
export function createMockLogger(): MockLogger {
  return new MockLogger();
}

/**
 * Create a mock logger with pre-configured context
 */
export function createMockLoggerWithContext(context: Partial<LogContext>): MockLogger {
  const logger = new MockLogger();
  logger['_currentContext'] = { ...context };
  return logger;
}

/**
 * Jest/Vitest matcher for checking if logger was called with specific message
 */
export function toHaveLogged(
  logger: MockLogger,
  level?: string
): { pass: boolean; message: () => string } {
  const calls = level ? logger.getCallsByLevel(level) : logger.calls;

  return {
    pass: calls.length > 0,
    message: () =>
      level
        ? `Expected logger to have ${level} calls, but ${calls.length} were found`
        : `Expected logger to have any calls, but ${calls.length} were found`,
  };
}

/**
 * Jest/Vitest matcher for checking if logger was called with specific message
 */
export function toHaveLoggedMessage(
  logger: MockLogger,
  message: string,
  level?: string
): { pass: boolean; message: () => string } {
  const calls = level ? logger.getCallsByLevel(level) : logger.calls;
  const matchingCalls = calls.filter((call) =>
    call.message.toLowerCase().includes(message.toLowerCase())
  );

  return {
    pass: matchingCalls.length > 0,
    message: () =>
      `Expected logger to have logged message containing "${message}"${
        level ? ` at level "${level}"` : ''
      }, but ${matchingCalls.length} matching calls were found`,
  };
}

/**
 * Jest/Vitest matcher for checking if logger was called with specific level
 */
export function toHaveLoggedLevel(
  logger: MockLogger,
  level: string
): { pass: boolean; message: () => string } {
  const calls = logger.getCallsByLevel(level);

  return {
    pass: calls.length > 0,
    message: () => `Expected logger to have ${level} calls, but ${calls.length} were found`,
  };
}

/**
 * Utility to create a spy that captures logger calls
 */
export function createLoggerSpy(): {
  logger: MockLogger;
  calls: readonly MockLogCall[];
  clear: () => void;
  getCallsByLevel: (level: string) => MockLogCall[];
  getLastCall: () => MockLogCall | undefined;
  hasLogs: (level?: string) => boolean;
} {
  const logger = new MockLogger();

  return {
    logger,
    get calls() {
      return logger.calls;
    },
    clear: () => logger.clear(),
    getCallsByLevel: (level: string) => logger.getCallsByLevel(level),
    getLastCall: () => logger.getLastCall(),
    hasLogs: (level?: string) => logger.hasLogs(level),
  };
}

/**
 * Setup function for Jest/Vitest to extend expect with logger matchers
 */
export function setupLoggerMatchers(): void {
  if (typeof expect !== 'undefined' && expect.extend) {
    expect.extend({
      toHaveLogged,
      toHaveLoggedMessage,
      toHaveLoggedLevel,
    });
  }
}

/* eslint-disable @typescript-eslint/consistent-type-definitions */
// Type declarations for the custom matchers (Jest/Vitest)
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveLogged(level?: string): R;
      toHaveLoggedMessage(message: string, level?: string): R;
      toHaveLoggedLevel(level: string): R;
    }
  }

  namespace Vi {
    interface Assertion {
      toHaveLogged(level?: string): void;
      toHaveLoggedMessage(message: string, level?: string): void;
      toHaveLoggedLevel(level: string): void;
    }
  }
}
/* eslint-enable @typescript-eslint/consistent-type-definitions */

export {};

/**
 * Helper to create isolated logger instances for parallel tests
 */
export function createIsolatedMockLogger(): {
  logger: MockLogger;
  reset: () => void;
  getLogs: () => MockLogCall[];
  getErrorLogs: () => MockLogCall[];
  getWarnLogs: () => MockLogCall[];
  assertNoErrors: () => void;
  assertLogged: (message: string, level?: string) => void;
} {
  const logger = new MockLogger();

  return {
    logger,

    reset: () => logger.clear(),

    getLogs: () => [...logger.calls],

    getErrorLogs: () => logger.getCallsByLevel('error'),

    getWarnLogs: () => logger.getCallsByLevel('warn'),

    assertNoErrors: () => {
      const errors = logger.getCallsByLevel('error');
      if (errors.length > 0) {
        throw new Error(
          `Expected no error logs, but found ${errors.length}: ${errors.map((error) => error.message).join(', ')}`
        );
      }
    },

    assertLogged: (message: string, level?: string) => {
      const calls = level ? logger.getCallsByLevel(level) : logger.calls;
      const matchingCalls = calls.filter((call) =>
        call.message.toLowerCase().includes(message.toLowerCase())
      );

      if (matchingCalls.length === 0) {
        const levelMessage = level ? ` at level "${level}"` : '';
        throw new Error(
          `Expected logger to have logged message containing "${message}"${levelMessage}`
        );
      }
    },
  };
}

/**
 * Mock logger factory for testing different logger configurations
 */
export class MockLoggerFactory {
  private readonly loggers: Map<string, MockLogger> = new Map();

  /**
   * Create or get a named logger instance
   */
  getLogger(name: string): MockLogger {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, new MockLogger());
    }
    const logger = this.loggers.get(name);
    if (!logger) {
      throw new Error(`Failed to create logger for name: ${name}`);
    }
    return logger;
  }

  /**
   * Clear all loggers
   */
  clearAll(): void {
    for (const logger of this.loggers.values()) {
      logger.clear();
    }
  }

  /**
   * Get all logger instances
   */
  getAllLoggers(): MockLogger[] {
    return Array.from(this.loggers.values());
  }

  /**
   * Get total call count across all loggers
   */
  getTotalCallCount(): number {
    return Array.from(this.loggers.values()).reduce(
      (total, logger) => total + logger.calls.length,
      0
    );
  }
}

/**
 * Create a mock logger factory
 */
export function createMockLoggerFactory(): MockLoggerFactory {
  return new MockLoggerFactory();
}
