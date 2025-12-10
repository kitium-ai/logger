/**
 * Async Logging Queue - High Priority Implementation
 * Provides non-blocking log operations with configurable buffers and graceful shutdown
 */

import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export type LogEntry = {
  level: string;
  message: string;
  meta?: unknown;
  error?: Error;
  timestamp: number;
  contextId?: string;
  auditSignature?: string;
  retryCount?: number;
  nextRetryTime?: number;
  id?: string;
};

export type AsyncQueueConfig = {
  maxQueueSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
  enablePersistence: boolean;
  persistencePath?: string;
  enableGuaranteedDelivery: boolean;
  deadLetterQueuePath?: string;
  maxDeadLetterSize: number;
  retryBackoffMultiplier: number;
  maxRetryDelay: number;
};

export type AsyncQueueStats = {
  queued: number;
  processed: number;
  failed: number;
  dropped: number;
  avgProcessingTime: number;
  queueSize: number;
  isHealthy: boolean;
  deadLetterCount: number;
  retryQueueSize: number;
  guaranteedDeliveryRate: number;
  avgRetryDelay: number;
  throughputPerSecond: number;
  errorRate: number;
};

export class AsyncLoggingQueue extends EventEmitter {
  private queue: LogEntry[] = [];
  private retryQueue: LogEntry[] = [];
  private deadLetterQueue: LogEntry[] = [];
  private processing = false;
  private isShutdown = false;
  private flushTimer: NodeJS.Timeout | undefined;
  private retryTimer: NodeJS.Timeout | undefined;
  private metricsTimer: NodeJS.Timeout | undefined;
  private readonly stats = {
    queued: 0,
    processed: 0,
    failed: 0,
    dropped: 0,
    deadLetterCount: 0,
    retryQueueSize: 0,
    processingTimes: [] as number[],
    retryDelays: [] as number[],
    lastProcessed: Date.now(),
    throughputHistory: [] as number[],
  };

  constructor(
    private readonly config: AsyncQueueConfig,
    private readonly processor: (entries: LogEntry[]) => Promise<void>
  ) {
    super();
    this.setupFlushTimer();
    this.setupShutdownHandlers();

    if (this.config.enableGuaranteedDelivery) {
      this.setupRetryTimer();
      this.setupMetricsCollection();
      this.loadPersistedQueues();
    }
  }

  /**
   * Add log entry to queue (non-blocking)
   */
  enqueue(entry: LogEntry): boolean {
    if (this.isShutdown) {
      this.stats.dropped++;
      this.emit('dropped', entry);
      return false;
    }

    // Assign unique ID for guaranteed delivery tracking
    if (this.config.enableGuaranteedDelivery && !entry.id) {
      entry.id = this.generateId();
    }

    if (this.queue.length >= this.config.maxQueueSize) {
      if (this.config.enableGuaranteedDelivery) {
        // Move to retry queue with backoff
        this.moveToRetryQueue(entry);
      } else {
        this.stats.dropped++;
        this.emit('dropped', entry);
      }
      return false;
    }

    this.queue.push(entry);
    this.stats.queued++;
    this.emit('enqueued', entry);

    // Process immediately if queue is getting full
    if (this.queue.length >= this.config.maxQueueSize * 0.8) {
      void this.processQueue();
    }

    return true;
  }

  /**
   * Graceful shutdown with queue flushing
   */
  async shutdown(): Promise<void> {
    this.isShutdown = true;

    // Clear all timers
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    // Persist queues before shutdown
    if (this.config.enableGuaranteedDelivery) {
      this.persistQueues();
    }

    // Process remaining items
    if (this.queue.length > 0) {
      await this.processQueue();
    }

    this.emit('shutdown');
  }

  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        void this.processQueue();
      }
    }, this.config.flushInterval);
  }

  private setupShutdownHandlers(): void {
    process.on('SIGTERM', () => {
      void this.handleShutdown();
    });
    process.on('SIGINT', () => {
      void this.handleShutdown();
    });
    process.on('beforeExit', () => {
      void this.handleShutdown();
    });
  }

  private async handleShutdown(): Promise<void> {
    if (!this.isShutdown) {
      await this.shutdown();
    }
  }

  /* eslint-disable max-statements */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const entries = [...this.queue];
    this.queue = [];

    const startTime = Date.now();

    try {
      await this.processWithRetry(entries);
      this.stats.processed += entries.length;
      this.stats.lastProcessed = Date.now();
      this.emit('processed', entries);
    } catch (error) {
      this.stats.failed += entries.length;
      this.emit('failed', entries, error);

      if (this.config.enableGuaranteedDelivery) {
        // Handle failed entries with guaranteed delivery
        for (const entry of entries) {
          this.handleFailedEntry(entry);
        }
      } else {
        // Re-queue failed entries if not shutting down
        if (!this.isShutdown) {
          this.queue.unshift(...entries);
        }
      }
    } finally {
      const processingTime = Date.now() - startTime;
      this.stats.processingTimes.push(processingTime);

      // Keep only last 100 processing times for avg calculation
      if (this.stats.processingTimes.length > 100) {
        this.stats.processingTimes = this.stats.processingTimes.slice(-100);
      }

      this.processing = false;
    }
  }

  private async processWithRetry(entries: LogEntry[], attempt = 1): Promise<void> {
    try {
      await this.processor(entries);
    } catch (error) {
      if (attempt < this.config.maxRetries) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, this.config.retryDelay * attempt);
        });
        return this.processWithRetry(entries, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Handle failed entry with guaranteed delivery logic
   */
  private handleFailedEntry(entry: LogEntry): void {
    const retryCount = (entry.retryCount ?? 0) + 1;

    if (retryCount >= this.config.maxRetries) {
      // Move to dead letter queue
      this.moveToDeadLetterQueue(entry);
    } else {
      // Move to retry queue with exponential backoff
      entry.retryCount = retryCount;
      const backoffDelay = Math.min(
        this.config.retryDelay * this.config.retryBackoffMultiplier ** (retryCount - 1),
        this.config.maxRetryDelay
      );
      entry.nextRetryTime = Date.now() + backoffDelay;
      this.stats.retryDelays.push(backoffDelay);
      this.retryQueue.push(entry);
      this.stats.retryQueueSize = this.retryQueue.length;
    }
  }

  /**
   * Move entry to retry queue
   */
  private moveToRetryQueue(entry: LogEntry): void {
    entry.retryCount = (entry.retryCount ?? 0) + 1;
    const backoffDelay = Math.min(
      this.config.retryDelay * this.config.retryBackoffMultiplier ** (entry.retryCount - 1),
      this.config.maxRetryDelay
    );
    entry.nextRetryTime = Date.now() + backoffDelay;
    this.stats.retryDelays.push(backoffDelay);
    this.retryQueue.push(entry);
    this.stats.retryQueueSize = this.retryQueue.length;
    this.emit('retry-queued', entry);
  }

  /**
   * Move entry to dead letter queue
   */
  private moveToDeadLetterQueue(entry: LogEntry): void {
    if (this.deadLetterQueue.length >= this.config.maxDeadLetterSize) {
      // Remove oldest entry to make room
      this.deadLetterQueue.shift();
    }
    this.deadLetterQueue.push(entry);
    this.stats.deadLetterCount = this.deadLetterQueue.length;
    this.emit('dead-lettered', entry);
  }

  /**
   * Process retry queue entries that are ready
   */
  private processRetryQueue(): void {
    const now = Date.now();
    const readyEntries: LogEntry[] = [];

    // Find entries ready for retry
    this.retryQueue = this.retryQueue.filter((entry) => {
      if ((entry.nextRetryTime ?? 0) <= now) {
        readyEntries.push(entry);
        return false;
      }
      return true;
    });

    // Re-queue ready entries for processing
    for (const entry of readyEntries) {
      if (this.queue.length < this.config.maxQueueSize) {
        this.queue.push(entry);
        this.stats.retryQueueSize = this.retryQueue.length;
        this.emit('retry-attempt', entry);
      } else {
        // If main queue is full, keep in retry queue
        this.retryQueue.push(entry);
      }
    }

    if (readyEntries.length > 0) {
      void this.processQueue();
    }
  }

  /**
   * Setup retry timer for guaranteed delivery
   */
  private setupRetryTimer(): void {
    this.retryTimer = setInterval(
      () => {
        this.processRetryQueue();
      },
      Math.min(this.config.retryDelay, 1000)
    ); // Check every second or retry delay, whichever is smaller
  }

  /**
   * Setup metrics collection
   */
  private setupMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
    }, 10000); // Collect metrics every 10 seconds
  }

  /**
   * Collect performance metrics
   */
  private collectMetrics(): void {
    const timeWindow = 60000; // 1 minute window
    const recentProcessed = this.stats.processingTimes.filter(
      (_, index) => index >= this.stats.processingTimes.length - Math.floor(timeWindow / 10000)
    ).length;

    const throughput = recentProcessed / (timeWindow / 1000); // per second
    this.stats.throughputHistory.push(throughput || 0);

    // Keep only last 10 throughput measurements
    if (this.stats.throughputHistory.length > 10) {
      this.stats.throughputHistory = this.stats.throughputHistory.slice(-10);
    }

    this.emit('metrics-updated', this.getStats());
  }

  /**
   * Generate unique ID for log entries
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load persisted queues on startup
   */
  private loadPersistedQueues(): void {
    if (!this.config.enablePersistence || !this.config.persistencePath) {
      return;
    }

    try {
      // Load retry queue
      const retryPath = `${this.config.persistencePath}/retry-queue.json`;
      if (this.isValidFilePath(retryPath) && existsSync(retryPath)) {
        const retryData = readFileSync(retryPath, 'utf8');
        this.retryQueue = JSON.parse(retryData);
        this.stats.retryQueueSize = this.retryQueue.length;
      }

      // Load dead letter queue
      const dlqPath =
        this.config.deadLetterQueuePath ?? `${this.config.persistencePath}/dead-letter-queue.json`;
      if (this.isValidFilePath(dlqPath) && existsSync(dlqPath)) {
        const dlqData = readFileSync(dlqPath, 'utf8');
        this.deadLetterQueue = JSON.parse(dlqData);
        this.stats.deadLetterCount = this.deadLetterQueue.length;
      }
    } catch (error) {
      this.emit('persistence-load-error', error);
    }
  }

  /**
   * Persist queues to disk
   */
  private persistQueues(): void {
    if (!this.config.enablePersistence || !this.config.persistencePath) {
      return;
    }

    try {
      if (this.isValidFilePath(this.config.persistencePath)) {
        mkdirSync(this.config.persistencePath, { recursive: true });

        // Persist retry queue
        const retryPath = `${this.config.persistencePath}/retry-queue.json`;
        if (this.isValidFilePath(retryPath)) {
          writeFileSync(retryPath, JSON.stringify(this.retryQueue));
        }

        // Persist dead letter queue
        const dlqPath =
          this.config.deadLetterQueuePath ??
          `${this.config.persistencePath}/dead-letter-queue.json`;
        if (this.isValidFilePath(dlqPath)) {
          writeFileSync(dlqPath, JSON.stringify(this.deadLetterQueue));
        }
      }
    } catch (error) {
      this.emit('persistence-error', error);
    }
  }

  /**
   * Get comprehensive queue statistics
   */
  getStats(): AsyncQueueStats {
    const totalProcessed = this.stats.processed + this.stats.failed;
    const guaranteedDeliveryRate =
      totalProcessed > 0 ? (this.stats.processed / totalProcessed) * 100 : 100;
    const avgProcessingTime =
      this.stats.processingTimes.length > 0
        ? this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length
        : 0;
    const avgRetryDelay =
      this.stats.retryDelays.length > 0
        ? this.stats.retryDelays.reduce((a, b) => a + b, 0) / this.stats.retryDelays.length
        : 0;
    const throughputPerSecond =
      this.stats.throughputHistory.length > 0
        ? this.stats.throughputHistory.reduce((a, b) => a + b, 0) /
          this.stats.throughputHistory.length
        : 0;
    const errorRate = totalProcessed > 0 ? (this.stats.failed / totalProcessed) * 100 : 0;

    return {
      queued: this.stats.queued,
      processed: this.stats.processed,
      failed: this.stats.failed,
      dropped: this.stats.dropped,
      avgProcessingTime,
      queueSize: this.queue.length,
      isHealthy: !this.isShutdown && this.queue.length < this.config.maxQueueSize,
      deadLetterCount: this.stats.deadLetterCount,
      retryQueueSize: this.stats.retryQueueSize,
      guaranteedDeliveryRate,
      avgRetryDelay,
      throughputPerSecond,
      errorRate,
    };
  }

  /**
   * Get dead letter queue contents
   */
  getDeadLetterQueue(): LogEntry[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
    this.stats.deadLetterCount = 0;
    this.emit('dead-letter-cleared');
  }

  /**
   * Re-queue entries from dead letter queue
   */
  requeueFromDeadLetter(count = 1): LogEntry[] {
    const requeued: LogEntry[] = [];
    for (let index = 0; index < Math.min(count, this.deadLetterQueue.length); index++) {
      const entry = this.deadLetterQueue.shift();
      if (entry) {
        entry.retryCount = 0; // Reset retry count
        entry.nextRetryTime = 0;
        this.queue.push(entry);
        requeued.push(entry);
      }
    }
    this.stats.deadLetterCount = this.deadLetterQueue.length;
    if (requeued.length > 0) {
      this.emit('dead-letter-requeued', requeued);
      void this.processQueue();
    }
    return requeued;
  }

  /**
   * Validate file path for security
   */
  private isValidFilePath(filePath: string): boolean {
    // Basic validation to prevent directory traversal and ensure it's a JSON file
    const normalizedPath = filePath.replace(/\\/g, '/');
    return (
      normalizedPath.endsWith('.json') &&
      !normalizedPath.includes('../') &&
      !normalizedPath.includes('..\\') &&
      normalizedPath.split('/').every((segment) => segment !== '..' && segment !== '')
    );
  }
}
