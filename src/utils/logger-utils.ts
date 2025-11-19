import { getLogger } from '../logger/logger';

/**
 * Create a performance timer for measuring operation duration
 */
export function createTimer(label = 'Operation') {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  return {
    end: (metadata?: Record<string, any>) => {
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
  fn: () => Promise<T>,
  context?: { operation: string; metadata?: Record<string, any> },
): Promise<T> {
  const operation = context?.operation || 'Operation';
  const timer = createTimer(operation);

  try {
    const result = await fn();
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
  fn: () => T,
  context?: { operation: string; metadata?: Record<string, any> },
): T {
  const operation = context?.operation || 'Operation';
  const timer = createTimer(operation);

  try {
    const result = fn();
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
export function logFunctionCall<T extends any[], R>(
  fn: (...args: T) => R,
  fnName: string = fn.name || 'anonymous',
) {
  return (...args: T) => {
    getLogger().debug(`Entering ${fnName}`, { args });
    try {
      const result = fn(...args);
      getLogger().debug(`Exiting ${fnName}`, { result });
      return result;
    } catch (error) {
      getLogger().error(`Error in ${fnName}`, { args }, error as Error);
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
    public readonly metadata?: Record<string, any>,
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
  private logs: Array<{ level: string; message: string; metadata?: any }> = [];

  add(level: string, message: string, metadata?: any): this {
    this.logs.push({ level, message, metadata });
    return this;
  }

  error(message: string, metadata?: any): this {
    return this.add('error', message, metadata);
  }

  warn(message: string, metadata?: any): this {
    return this.add('warn', message, metadata);
  }

  info(message: string, metadata?: any): this {
    return this.add('info', message, metadata);
  }

  debug(message: string, metadata?: any): this {
    return this.add('debug', message, metadata);
  }

  async flush(): Promise<void> {
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
  metadata?: Record<string, any>;
  stack?: string;
}

/**
 * Create audit log entry (for compliance and security auditing)
 */
export function auditLog(
  action: string,
  resource: string,
  actor?: string,
  details?: Record<string, any>,
): void {
  const logger = getLogger();
  logger.info(`Audit: ${action} on ${resource}`, {
    auditAction: action,
    auditResource: resource,
    actor,
    ...details,
  });
}
