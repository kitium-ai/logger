import type { AsyncQueueStats, LogEntry } from '../../utils/async-logging-queue';

/**
 * Queue Logger Interface
 * Provides access to async logging queue and dead-letter queue management
 */
export type IQueueLogger = {
  /**
   * Get current queue statistics
   */
  getQueueStats(): AsyncQueueStats;

  /**
   * Get all entries in the dead-letter queue
   */
  getDeadLetterQueue(): LogEntry[];

  /**
   * Clear all entries from the dead-letter queue
   */
  clearDeadLetterQueue(): void;

  /**
   * Requeue entries from dead-letter queue for retry
   * @param count - Number of entries to requeue (defaults to all)
   * @returns Array of entries that were requeued
   */
  requeueFromDeadLetter(count?: number): LogEntry[];
};
