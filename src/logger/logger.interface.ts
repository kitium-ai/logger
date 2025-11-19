import type { LogContext } from '../context/async-context';

/**
 * Abstract base interface for all logger implementations
 */
export type ILogger = {
  error(message: string, meta?: unknown, error?: Error): void;
  warn(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  http(message: string, meta?: unknown): void;
  debug(message: string, meta?: unknown): void;
  withContext<T>(context: Partial<LogContext>, fn: () => T | Promise<T>): T | Promise<T>;
  child(metadata: Record<string, unknown>): ILogger;
  close(): Promise<void>;
};

/**
 * Log entry structure for storage
 */
export type LogEntry = {
  timestamp: string;
  level: string;
  message: string;
  metadata?: unknown;
  error?: {
    message: string;
    stack?: string;
  };
  context?: {
    traceId: string;
    spanId?: string;
    userId?: string;
    requestId?: string;
    sessionId?: string;
    correlationId?: string;
  };
};
