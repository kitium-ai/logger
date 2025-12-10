// eslint-disable-next-line no-restricted-imports
import type { LogEntry } from '../../utils/async-logging-queue';

/**
 * Searchable Logger Interface
 * Provides advanced search and filtering capabilities for log entries
 */
export type ISearchableLogger = {
  /**
   * Get logs by filter criteria
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
  }): LogEntry[];

  /**
   * Search logs by query string
   * @param query - Search query string
   * @param options - Search options
   */
  searchLogs(
    query: string,
    options?: {
      caseSensitive?: boolean;
      fields?: Array<'message' | 'meta' | 'level' | 'contextId'>;
      limit?: number;
    }
  ): LogEntry[];

  /**
   * Get logs within a specific time range
   * @param startTime - Start timestamp in milliseconds
   * @param endTime - End timestamp in milliseconds
   */
  getLogsByTimeRange(startTime: number, endTime: number): LogEntry[];

  /**
   * Get logs by a specific metadata field value
   * @param field - Metadata field name
   * @param value - Field value to match
   */
  getLogsByMetaField(field: string, value: unknown): LogEntry[];
};
