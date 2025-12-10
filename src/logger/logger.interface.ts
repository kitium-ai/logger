import type { LogContext } from '../context/async-context';
import type { AsyncQueueStats, LogEntry } from '../utils/async-logging-queue';
import type { PerformanceMetrics, AlertCondition } from '../utils/metrics-collector';

// Re-export LogEntry for backward compatibility
export type { LogEntry } from '../utils/async-logging-queue';

/**
 * Abstract base interface for all logger implementations
 */
export type ILogger = {
  error(message: string, meta?: unknown, error?: Error): void;
  warn(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  http(message: string, meta?: unknown): void;
  debug(message: string, meta?: unknown): void;
  withContext<T>(context: Partial<LogContext>, function_: () => T | Promise<T>): T | Promise<T>;
  child(metadata: Record<string, unknown>): ILogger;
  close(): Promise<void>;
  getQueueStats?(): AsyncQueueStats;
  getDeadLetterQueue?(): LogEntry[];
  clearDeadLetterQueue?(): void;
  requeueFromDeadLetter?(count?: number): LogEntry[];
  getMetricsSummary?(): {
    current: PerformanceMetrics | null;
    averages: Partial<PerformanceMetrics>;
    alerts: AlertCondition[];
    trends: any;
  };
  getMetricsRange?(startTime: number, endTime: number): PerformanceMetrics[];
  exportMetrics?(): { metrics: PerformanceMetrics[]; alerts: AlertCondition[]; customMetrics?: any[] };
  // Advanced filtering methods (low priority enhancements)
  getLogsByFilter?(filter: {
    level?: string | string[];
    messagePattern?: string | RegExp;
    traceId?: string;
    userId?: string;
    startTime?: number;
    endTime?: number;
    meta?: Record<string, unknown>;
    limit?: number;
    offset?: number;
  }): LogEntry[];
  searchLogs?(query: string, options?: {
    caseSensitive?: boolean;
    fields?: ('message' | 'meta' | 'level' | 'contextId')[];
    limit?: number;
  }): LogEntry[];
  getLogsByTimeRange?(startTime: number, endTime: number): LogEntry[];
  getLogsByMetaField?(field: string, value: unknown): LogEntry[];
};
