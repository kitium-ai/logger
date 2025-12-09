/**
 * Async Logging Queue - High Priority Implementation
 * Provides non-blocking log operations with configurable buffers and graceful shutdown
 */

import { EventEmitter } from 'events';

export interface LogEntry {
  level: string;
  message: string;
  meta?: unknown;
  error?: Error;
  timestamp: number;
  contextId?: string;
  auditSignature?: string;
}

export interface AsyncQueueConfig {
  maxQueueSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
  enablePersistence: boolean;
  persistencePath?: string;
}

export interface AsyncQueueStats {
  queued: number;
  processed: number;
  failed: number;
  dropped: number;
  avgProcessingTime: number;
  queueSize: number;
  isHealthy: boolean;
}

export class AsyncLoggingQueue extends EventEmitter {
  private queue: LogEntry[] = [];
  private processing = false;
  private isShutdown = false;
  private flushTimer?: NodeJS.Timeout;
  private stats = {
    queued: 0,
    processed: 0,
    failed: 0,
    dropped: 0,
    processingTimes: [] as number[],
    lastProcessed: Date.now(),
  };

  constructor(
    private config: AsyncQueueConfig,
    private processor: (entries: LogEntry[]) => Promise<void>
  ) {
    super();
    this.setupFlushTimer();
    this.setupShutdownHandlers();
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

    if (this.queue.length >= this.config.maxQueueSize) {
      this.stats.dropped++;
      this.emit('dropped', entry);
      return false;
    }

    this.queue.push(entry);
    this.stats.queued++;
    this.emit('enqueued', entry);

    // Process immediately if queue is getting full
    if (this.queue.length >= this.config.maxQueueSize * 0.8) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Get current queue statistics
   */
  getStats(): AsyncQueueStats {
    const avgProcessingTime = this.stats.processingTimes.length > 0
      ? this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length
      : 0;

    return {
      queued: this.stats.queued,
      processed: this.stats.processed,
      failed: this.stats.failed,
      dropped: this.stats.dropped,
      avgProcessingTime,
      queueSize: this.queue.length,
      isHealthy: !this.isShutdown && this.queue.length < this.config.maxQueueSize,
    };
  }

  /**
   * Graceful shutdown with queue flushing
   */
  async shutdown(): Promise<void> {
    this.isShutdown = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined!;
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
        this.processQueue();
      }
    }, this.config.flushInterval);
  }

  private setupShutdownHandlers(): void {
    process.on('SIGTERM', () => this.handleShutdown());
    process.on('SIGINT', () => this.handleShutdown());
    process.on('beforeExit', () => this.handleShutdown());
  }

  private async handleShutdown(): Promise<void> {
    if (!this.isShutdown) {
      await this.shutdown();
    }
  }

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

      // Re-queue failed entries if not shutting down
      if (!this.isShutdown) {
        this.queue.unshift(...entries);
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
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        return this.processWithRetry(entries, attempt + 1);
      }
      throw error;
    }
  }
}