import { contextManager, type LogContext } from '../context/async-context';
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
   * Check if log matches level filter
   */
  private matchesLevel(log: LogEntry, levels: string[]): boolean {
    return levels.includes(log.level);
  }

  /**
   * Check if log matches message pattern filter
   */
  private matchesMessagePattern(log: LogEntry, pattern: string | RegExp): boolean {
    try {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      return regex.test(log.message);
    } catch {
      // Invalid regex pattern, return false
      return false;
    }
  }

  /**
   * Check if log matches trace/context ID filter
   */
  private matchesTraceId(log: LogEntry, traceId: string): boolean {
    return log.contextId === traceId;
  }

  /**
   * Check if log matches user ID filter
   */
  private matchesUserId(log: LogEntry, userId: string): boolean {
    if (typeof log.meta === 'object' && log.meta !== null) {
      const meta = log.meta as Record<string, unknown>;
      return meta['userId'] === userId;
    }
    return false;
  }

  /**
   * Check if log is within time range
   */
  private isWithinTimeRange(
    log: LogEntry,
    startTime: number | undefined,
    endTime: number | undefined
  ): boolean {
    return !(startTime && log.timestamp < startTime) && !(endTime && log.timestamp > endTime);
  }

  /**
   * Check if log metadata matches filter
   */
  private matchesMetadata(log: LogEntry, filterMeta: Record<string, unknown>): boolean {
    if (typeof log.meta !== 'object' || log.meta === null) {
      return false;
    }
    const meta = log.meta as Record<string, unknown>;
    for (const [key, value] of Object.entries(filterMeta)) {
      if (!(key in meta) || meta[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if log passes all filter criteria
   */
  /**
   * Check if log passes level filter
   */
  private checkLevelFilter(log: LogEntry, level?: string | string[]): boolean {
    if (!level) {
      return true;
    }
    const levels = Array.isArray(level) ? level : [level];
    return this.matchesLevel(log, levels);
  }

  /**
   * Check if log passes message pattern filter
   */
  private checkMessageFilter(log: LogEntry, messagePattern?: string | RegExp): boolean {
    if (!messagePattern) {
      return true;
    }
    return this.matchesMessagePattern(log, messagePattern);
  }

  /**
   * Check if log passes trace ID filter
   */
  private checkTraceIdFilter(log: LogEntry, traceId?: string): boolean {
    if (!traceId) {
      return true;
    }
    return this.matchesTraceId(log, traceId);
  }

  /**
   * Check if log passes user ID filter
   */
  private checkUserIdFilter(log: LogEntry, userId?: string): boolean {
    if (!userId) {
      return true;
    }
    return this.matchesUserId(log, userId);
  }

  /**
   * Check if log passes metadata filter
   */
  private checkMetadataFilter(log: LogEntry, meta?: Record<string, unknown>): boolean {
    if (!meta) {
      return true;
    }
    return this.matchesMetadata(log, meta);
  }

  /**
   * Check if log matches all criteria
   */
  private logMatchesAllCriteria(
    log: LogEntry,
    filter: {
      level?: string | string[];
      messagePattern?: string | RegExp;
      traceId?: string;
      userId?: string;
      startTime?: number;
      endTime?: number;
      meta?: Record<string, unknown>;
    }
  ): boolean {
    return (
      this.checkLevelFilter(log, filter.level) &&
      this.checkMessageFilter(log, filter.messagePattern) &&
      this.checkTraceIdFilter(log, filter.traceId) &&
      this.checkUserIdFilter(log, filter.userId) &&
      this.isWithinTimeRange(log, filter.startTime, filter.endTime) &&
      this.checkMetadataFilter(log, filter.meta)
    );
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
    let filtered = this.logs.filter((log) => this.logMatchesAllCriteria(log, filter));

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
   * Get message field value
   */
  private getMessageFieldValue(log: LogEntry, caseSensitive: boolean): string {
    return caseSensitive ? log.message : log.message.toLowerCase();
  }

  /**
   * Get level field value
   */
  private getLevelFieldValue(log: LogEntry, caseSensitive: boolean): string {
    return caseSensitive ? log.level : log.level.toLowerCase();
  }

  /**
   * Get context ID field value
   */
  private getContextIdFieldValue(log: LogEntry, caseSensitive: boolean): string {
    let fieldValue = log.contextId ?? '';
    if (!caseSensitive) {
      fieldValue = fieldValue.toLowerCase();
    }
    return fieldValue;
  }

  /**
   * Get metadata field value
   */
  private getMetaFieldValue(log: LogEntry, caseSensitive: boolean): string {
    if (typeof log.meta === 'object' && log.meta !== null) {
      return caseSensitive ? JSON.stringify(log.meta) : JSON.stringify(log.meta).toLowerCase();
    }
    return '';
  }

  /**
   * Extract field value from log for searching
   */
  private getLogFieldValue(
    log: LogEntry,
    field: 'message' | 'meta' | 'level' | 'contextId',
    caseSensitive: boolean
  ): string {
    switch (field) {
      case 'message':
        return this.getMessageFieldValue(log, caseSensitive);
      case 'level':
        return this.getLevelFieldValue(log, caseSensitive);
      case 'contextId':
        return this.getContextIdFieldValue(log, caseSensitive);
      case 'meta':
        return this.getMetaFieldValue(log, caseSensitive);
    }
  }

  /**
   * Check if log matches search in any field
   */
  private logMatchesSearch(
    log: LogEntry,
    searchTerm: string,
    fields: Array<'message' | 'meta' | 'level' | 'contextId'>,
    caseSensitive: boolean
  ): boolean {
    for (const field of fields) {
      const fieldValue = this.getLogFieldValue(log, field, caseSensitive);
      if (fieldValue.includes(searchTerm)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Search logs with full-text search across message and metadata
   */
  searchLogs(
    query: string,
    options: {
      caseSensitive?: boolean;
      fields?: Array<'message' | 'meta' | 'level' | 'contextId'>;
      limit?: number;
    } = {}
  ): LogEntry[] {
    const { caseSensitive = false, fields = ['message', 'meta'], limit } = options;
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    const results = this.logs.filter((log) =>
      this.logMatchesSearch(log, searchTerm, fields, caseSensitive)
    );

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
