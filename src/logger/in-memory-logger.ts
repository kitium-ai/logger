import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';
import type { ILogger, LogEntry } from './logger.interface';

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

  /**
   * Get the service name for this logger
   */
  getServiceName(): string {
    return this.serviceName;
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

  withContext<T>(context: Partial<LogContext>, function_: () => T | Promise<T>): T | Promise<T> {
    const fullContext = contextManager.initContext(context);
    return contextManager.run(fullContext, () => function_());
  }

  child(_metadata: Record<string, unknown>): ILogger {
    // Return a new instance with metadata bound (not used in in-memory)
    return this;
  }

  close(): Promise<void> {
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
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.logs.filter((log) => regex.test(log.message));
  }

  /**
   * Get logs for a specific trace
   */
  getLogsByTraceId(traceId: string): LogEntry[] {
    return this.logs.filter((log) => log.contextId === traceId);
  }

  /**
   * Get logs for a specific user
   */
  getLogsByUserId(userId: string): LogEntry[] {
    return this.logs.filter((log) => {
      if (typeof log.meta === 'object' && log.meta !== null) {
        const meta = log.meta as Record<string, unknown>;
        return meta['userId'] === userId;
      }
      return false;
    });
  }

  /**
   * Advanced filtering with multiple criteria
   */
  getLogsByFilter(filter: {
    level?: string | string[];
    messagePattern?: string | RegExp;
    traceId?: string;
    userId?: string;
    startTime?: number;
    endTime?: number;
    meta?: Record<string, unknown>;
    limit?: number;
    offset?: number;
  }): LogEntry[] {
    let filtered = this.logs.filter((log) => {
      // Level filter
      if (filter.level) {
        const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
        if (!levels.includes(log.level)) return false;
      }

      // Message pattern filter
      if (filter.messagePattern) {
        // eslint-disable-next-line security/detect-non-literal-regexp
        const regex = typeof filter.messagePattern === 'string'
          ? new RegExp(filter.messagePattern)
          : filter.messagePattern;
        if (!regex.test(log.message)) return false;
      }

      // Trace ID filter
      if (filter.traceId && log.contextId !== filter.traceId) return false;

      // User ID filter
      if (filter.userId) {
        if (typeof log.meta === 'object' && log.meta !== null) {
          const meta = log.meta as Record<string, unknown>;
          if (meta['userId'] !== filter.userId) return false;
        } else {
          return false;
        }
      }

      // Time range filter
      if (filter.startTime && log.timestamp < filter.startTime) return false;
      if (filter.endTime && log.timestamp > filter.endTime) return false;

      // Metadata filter
      if (filter.meta) {
        if (typeof log.meta !== 'object' || log.meta === null) return false;
        const meta = log.meta as Record<string, unknown>;
        for (const [key, value] of Object.entries(filter.meta)) {
          if (meta[key] !== value) return false;
        }
      }

      return true;
    });

    // Apply pagination
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Search logs with full-text search across message and metadata
   */
  searchLogs(query: string, options: {
    caseSensitive?: boolean;
    fields?: ('message' | 'meta' | 'level' | 'contextId')[];
    limit?: number;
  } = {}): LogEntry[] {
    const { caseSensitive = false, fields = ['message', 'meta'], limit } = options;
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    const results = this.logs.filter((log) => {
      const searchFields = fields;

      for (const field of searchFields) {
        let fieldValue = '';

        switch (field) {
          case 'message':
            fieldValue = caseSensitive ? log.message : log.message.toLowerCase();
            break;
          case 'level':
            fieldValue = caseSensitive ? log.level : log.level.toLowerCase();
            break;
          case 'contextId':
            fieldValue = log.contextId || '';
            if (!caseSensitive) fieldValue = fieldValue.toLowerCase();
            break;
          case 'meta':
            if (typeof log.meta === 'object' && log.meta !== null) {
              fieldValue = caseSensitive
                ? JSON.stringify(log.meta)
                : JSON.stringify(log.meta).toLowerCase();
            }
            break;
        }

        if (fieldValue.includes(searchTerm)) {
          return true;
        }
      }

      return false;
    });

    return limit ? results.slice(0, limit) : results;
  }

  /**
   * Get logs within a time range
   */
  getLogsByTimeRange(startTime: number, endTime: number): LogEntry[] {
    return this.logs.filter((log) => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  /**
   * Get logs by arbitrary metadata field
   */
  getLogsByMetaField(field: string, value: unknown): LogEntry[] {
    return this.logs.filter((log) => {
      if (typeof log.meta === 'object' && log.meta !== null) {
        const meta = log.meta as Record<string, unknown>;
        return meta[field] === value;
      }
      return false;
    });
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
    serviceName: string;
  } {
    const byLevel: Record<string, number> = {};

    this.logs.forEach((log) => {
      byLevel[log.level] = (byLevel[log.level] ?? 0) + 1;
    });

    const result: {
      totalLogs: number;
      byLevel: Record<string, number>;
      oldestLog?: string;
      newestLog?: string;
      serviceName: string;
    } = {
      totalLogs: this.logs.length,
      byLevel,
      serviceName: this.serviceName,
    };
    if (this.logs[0]?.timestamp) {
      result.oldestLog = new Date(this.logs[0].timestamp).toISOString();
    }
    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog?.timestamp) {
      result.newestLog = new Date(lastLog.timestamp).toISOString();
    }
    return result;
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
    // Enrich metadata with service name
    const enrichedMeta =
      meta !== undefined
        ? {
            ...(typeof meta === 'object' && meta !== null && !Array.isArray(meta)
              ? meta
              : { originalMeta: meta }),
            serviceName: this.serviceName,
          }
        : { serviceName: this.serviceName };
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      meta: enrichedMeta,
      contextId: context.traceId,
    };

    if (error) {
      entry.error = error;
    }

    this.logs.push(entry);

    // Maintain max size
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }
  }
}
