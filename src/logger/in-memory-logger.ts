import type { ILogger, LogEntry } from './logger.interface';
import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';

/**
 * In-memory logger for testing, debugging, and development
 * Stores logs in memory for inspection and does not persist to disk/cloud
 */
export class InMemoryLogger implements ILogger {
  private logs: LogEntry[] = [];
  private readonly maxSize: number;
  private readonly serviceName: string;

  constructor(options: { maxSize?: number; serviceName?: string } = {}) {
    this.maxSize = options.maxSize ?? 10000; // Keep last 10k logs
    this.serviceName = options.serviceName ?? 'in-memory-service';
  }

  error(message: string, meta?: unknown, error?: Error): void {
    this.addLog('error', message, meta, error);
  }

  warn(message: string, meta?: unknown): void {
    this.addLog('warn', message, meta);
  }

  info(message: string, meta?: unknown): void {
    this.addLog('info', message, meta);
  }

  http(message: string, meta?: unknown): void {
    this.addLog('http', message, meta);
  }

  debug(message: string, meta?: unknown): void {
    this.addLog('debug', message, meta);
  }

  withContext<T>(
    context: Partial<LogContext>,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    const fullContext = contextManager.initContext(context);
    return contextManager.run(fullContext, () => fn());
  }

  child(_metadata: Record<string, unknown>): ILogger {
    // Return a new instance with metadata bound (not used in in-memory)
    return this;
  }

  async close(): Promise<void> {
    // No resources to clean up for in-memory
    return Promise.resolve();
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: string): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs filtered by message pattern
   */
  getLogsByMessage(pattern: string | RegExp): LogEntry[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.logs.filter((log) => regex.test(log.message));
  }

  /**
   * Get logs for a specific trace
   */
  getLogsByTraceId(traceId: string): LogEntry[] {
    return this.logs.filter((log) => log.context?.traceId === traceId);
  }

  /**
   * Get logs for a specific user
   */
  getLogsByUserId(userId: string): LogEntry[] {
    return this.logs.filter((log) => log.context?.userId === userId);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get statistics about stored logs
   */
  getStats(): {
    totalLogs: number;
    byLevel: Record<string, number>;
    oldestLog?: string;
    newestLog?: string;
    } {
    const byLevel: Record<string, number> = {};

    this.logs.forEach((log) => {
      byLevel[log.level] = (byLevel[log.level] ?? 0) + 1;
    });

    return {
      totalLogs: this.logs.length,
      byLevel,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp,
    };
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs filtered by level
   */
  exportByLevel(level: string): string {
    return JSON.stringify(this.getLogsByLevel(level), null, 2);
  }

  private addLog(level: string, message: string, meta?: unknown, error?: Error): void {
    const context = contextManager.getContext();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: meta,
      context: {
        traceId: context.traceId,
        spanId: context.spanId,
        userId: context.userId,
        requestId: context.requestId,
        sessionId: context.sessionId,
        correlationId: context.correlationId,
      },
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    this.logs.push(entry);

    // Maintain max size
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }
  }
}
