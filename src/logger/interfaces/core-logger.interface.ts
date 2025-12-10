/**
 * Core Logger Interface
 * Defines the fundamental logging methods required by all logger implementations
 */
export type ICoreLogger = {
  /**
   * Log an error message with optional metadata and error object
   */
  error(message: string, meta?: unknown, error?: Error): void;

  /**
   * Log a warning message with optional metadata
   */
  warn(message: string, meta?: unknown): void;

  /**
   * Log an info message with optional metadata
   */
  info(message: string, meta?: unknown): void;

  /**
   * Log an HTTP request/response with optional metadata
   */
  http(message: string, meta?: unknown): void;

  /**
   * Log a debug message with optional metadata
   */
  debug(message: string, meta?: unknown): void;

  /**
   * Close the logger and clean up resources
   */
  close(): Promise<void>;
};
