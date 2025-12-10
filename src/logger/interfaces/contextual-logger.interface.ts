import type { LogContext } from '../../context/async-context';
import type { ICoreLogger } from './core-logger.interface';

/**
 * Contextual Logger Interface
 * Extends core logging with context management capabilities
 */
export type IContextualLogger = {
  /**
   * Execute a function within a specific logging context
   * @param context - Partial context to merge with current context
   * @param function_ - Function to execute within the context
   */
  withContext<T>(context: Partial<LogContext>, function_: () => T | Promise<T>): T | Promise<T>;

  /**
   * Create a child logger with additional metadata
   * @param metadata - Metadata to attach to all logs from the child logger
   */
  child(metadata: Record<string, unknown>): IContextualLogger;
} & ICoreLogger;
