import type { LogContext } from '../context/async-context';

/**
 * Abstract base interface for all logger implementations
 */
export type ILogger = {
  error(message: string, meta?: any, error?: Error): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  http(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
  withContext<T>(context: Partial<LogContext>, fn: () => T | Promise<T>): T | Promise<T>;
  child(metadata: Record<string, any>): ILogger;
  close(): Promise<void>;
}

/**
 * Log entry structure for storage
 */
export type LogEntry = {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
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
}
