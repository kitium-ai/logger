import { contextManager } from '../context/async-context';
import { getLogger } from '../logger/logger';
import type { LogContext } from '../context/async-context';

/**
 * Create a performance timer for measuring operation duration
 */
export function createTimer(label = 'Operation') {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  return {
    end: (metadata?: Record<string, unknown>) => {
      const duration = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;

      const logLevel = duration > 1000 ? 'warn' : 'debug';
      const message = `${label} completed in ${duration}ms`;

      if (logLevel === 'warn') {
        getLogger().warn(message, {
          duration,
          memoryUsed,
          ...metadata,
        });
      } else {
        getLogger().debug(message, {
          duration,
          memoryUsed,
          ...metadata,
        });
      }

      return { duration, memoryUsed };
    },
  };
}

/**
 * Wrap async function with automatic error logging
 */
export async function withErrorLogging<T>(
  function_: () => Promise<T>,
  context?: { operation: string; metadata?: Record<string, unknown> }
): Promise<T> {
  const operation = context?.operation ?? 'Operation';
  const timer = createTimer(operation);

  try {
    const result = await function_();
    timer.end(context?.metadata);
    return result;
  } catch (error) {
    getLogger().error(`${operation} failed`, context?.metadata, error as Error);
    throw error;
  }
}

/**
 * Wrap sync function with automatic error logging
 */
export function withErrorLoggingSync<T>(
  function_: () => T,
  context?: { operation: string; metadata?: Record<string, unknown> }
): T {
  const operation = context?.operation ?? 'Operation';
  const timer = createTimer(operation);

  try {
    const result = function_();
    timer.end(context?.metadata);
    return result;
  } catch (error) {
    getLogger().error(`${operation} failed`, context?.metadata, error as Error);
    throw error;
  }
}

/**
 * Log function entry and exit (useful for debugging)
 */
export function logFunctionCall<T extends unknown[], R>(
  function_: (...args: T) => R,
  functionName: string = function_.name ?? 'anonymous'
) {
  return (...args: T) => {
    getLogger().debug(`Entering ${functionName}`, { args });
    try {
      const result = function_(...args);
      getLogger().debug(`Exiting ${functionName}`, { result });
      return result;
    } catch (error) {
      getLogger().error(`Error in ${functionName}`, { args }, error as Error);
      throw error;
    }
  };
}

/**
 * Create structured error with context
 */
export class LoggableError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LoggableError';
    Object.setPrototypeOf(this, LoggableError.prototype);
  }

  log(level: 'error' | 'warn' | 'info' = 'error'): void {
    const logger = getLogger();
    const logData = {
      code: this.code,
      ...this.metadata,
    };

    if (level === 'error') {
      logger.error(this.message, logData, this);
    } else if (level === 'warn') {
      logger.warn(this.message, logData);
    } else {
      logger.info(this.message, logData);
    }
  }
}

/**
 * Create batch logger for logging multiple operations
 */
export class BatchLogger {
  private logs: Array<{ level: string; message: string; metadata?: unknown }> = [];

  add(level: string, message: string, metadata?: unknown): this {
    this.logs.push({ level, message, metadata });
    return this;
  }

  error(message: string, metadata?: unknown): this {
    return this.add('error', message, metadata);
  }

  warn(message: string, metadata?: unknown): this {
    return this.add('warn', message, metadata);
  }

  info(message: string, metadata?: unknown): this {
    return this.add('info', message, metadata);
  }

  debug(message: string, metadata?: unknown): this {
    return this.add('debug', message, metadata);
  }

  flush(): void {
    const logger = getLogger();
    for (const log of this.logs) {
      if (log.level === 'error') {
        logger.error(log.message, log.metadata);
      } else if (log.level === 'warn') {
        logger.warn(log.message, log.metadata);
      } else if (log.level === 'info') {
        logger.info(log.message, log.metadata);
      } else {
        logger.debug(log.message, log.metadata);
      }
    }
    this.logs = [];
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * Helper to wrap async handlers with logging context (framework-agnostic)
 */
export async function withLoggingContext<T>(
  context: Partial<LogContext>,
  handler: () => Promise<T>
): Promise<T> {
  const derivedContext = contextManager.initContext(context);
  return contextManager.run(derivedContext, handler);
}
/**
 * Convert winston info object to structured log entry
 */
export type StructuredLogEntry = {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  traceId: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
};

/**
 * Create audit log entry (for compliance and security auditing)
 */
export function auditLog(
  action: string,
  resource: string,
  actor?: string,
  details?: Record<string, unknown>
): void {
  const logger = getLogger();
  logger.info(`Audit: ${action} on ${resource}`, {
    auditAction: action,
    auditResource: resource,
    actor,
    ...details,
  });
}
