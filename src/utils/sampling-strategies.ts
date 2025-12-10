/**
 * Advanced Sampling Strategies - Low Priority Implementation
 * Sophisticated log sampling beyond basic rate-based sampling
 */

import type { LogEntry } from './async-logging-queue';

export type SamplingStrategy = {
  name: string;
  shouldSample(entry: LogEntry, context: SamplingContext): boolean;
  getStats(): SamplingStats;
  reset(): void;
};

export type SamplingContext = {
  totalProcessed: number;
  currentTime: number;
  recentEntries: LogEntry[];
  serviceStats: Map<string, ServiceSamplingStats>;
};

export type ServiceSamplingStats = {
  serviceName: string;
  sampledCount: number;
  totalCount: number;
  lastSampledTime: number;
  errorCount: number;
  warningCount: number;
};

export type SamplingStats = {
  strategyName: string;
  totalProcessed: number;
  totalSampled: number;
  samplingRate: number;
  serviceBreakdown: Record<string, { sampled: number; total: number; rate: number }>;
};

export class AdaptiveSamplingStrategy implements SamplingStrategy {
  name = 'adaptive';
  private processed = 0;
  private sampled = 0;
  private readonly serviceStats = new Map<string, ServiceSamplingStats>();
  private readonly errorThreshold = 0.1; // 10% error rate triggers higher sampling
  private readonly volumeThreshold = 100; // High volume triggers sampling
  private readonly timeWindow = 60000; // 1 minute window

  /* eslint-disable max-lines-per-function, max-statements */
  shouldSample(entry: LogEntry, context: SamplingContext): boolean {
    this.processed++;

    const serviceName = this.extractServiceName(entry);
    let stats = this.serviceStats.get(serviceName);

    if (!stats) {
      stats = {
        serviceName,
        sampledCount: 0,
        totalCount: 0,
        lastSampledTime: 0,
        errorCount: 0,
        warningCount: 0,
      };
      this.serviceStats.set(serviceName, stats);
    }

    stats.totalCount++;

    // Track errors and warnings
    if (entry.level === 'error') {
      stats.errorCount++;
    }
    if (entry.level === 'warn') {
      stats.warningCount++;
    }

    // Adaptive sampling logic
    let shouldSample = false;

    // Always sample errors
    if (entry.level === 'error') {
      shouldSample = true;
    }
    // Sample warnings at higher rate if error rate is high
    else if (entry.level === 'warn') {
      const errorRate = stats.errorCount / stats.totalCount;
      // Use errorThreshold to determine if we should increase sampling
      if (errorRate > this.errorThreshold) {
        shouldSample = true; // Always sample warnings when error rate is high
      } else {
        shouldSample = Math.random() < Math.min(0.5, errorRate * 5);
      }
    }
    // Sample info/debug based on volume and recency
    else {
      const timeSinceLastSample = context.currentTime - stats.lastSampledTime;
      const volumeRate = stats.totalCount / (context.currentTime / this.timeWindow);

      // Sample more frequently for high-volume services
      if (volumeRate > this.volumeThreshold) {
        shouldSample = Math.random() < 0.1; // 10% sampling for high volume
      }
      // Sample less frequently for low-volume services
      else if (timeSinceLastSample > 30000) {
        // 30 seconds
        shouldSample = Math.random() < 0.3; // 30% sampling for low volume
      }
    }

    if (shouldSample) {
      this.sampled++;
      stats.sampledCount++;
      stats.lastSampledTime = context.currentTime;
    }

    return shouldSample;
  }

  getStats(): SamplingStats {
    const serviceBreakdown: Record<string, { sampled: number; total: number; rate: number }> = {};

    for (const [service, stats] of this.serviceStats) {
      serviceBreakdown[service] = {
        sampled: stats.sampledCount,
        total: stats.totalCount,
        rate: stats.totalCount > 0 ? stats.sampledCount / stats.totalCount : 0,
      };
    }

    return {
      strategyName: this.name,
      totalProcessed: this.processed,
      totalSampled: this.sampled,
      samplingRate: this.processed > 0 ? this.sampled / this.processed : 0,
      serviceBreakdown,
    };
  }

  reset(): void {
    this.processed = 0;
    this.sampled = 0;
    this.serviceStats.clear();
  }

  private extractServiceName(entry: LogEntry): string {
    if (typeof entry.meta === 'object' && entry.meta !== null) {
      const meta = entry.meta as Record<string, unknown>;
      return (meta['serviceName'] as string) || (meta['service'] as string) || 'unknown';
    }
    return 'unknown';
  }
}

export class PriorityBasedSamplingStrategy implements SamplingStrategy {
  name = 'priority-based';
  private processed = 0;
  private sampled = 0;
  private readonly serviceStats = new Map<string, ServiceSamplingStats>();
  private readonly priorityLevels = new Map<string, number>();

  constructor(options: { priorityMap?: Record<string, number> } = {}) {
    // Default priority levels (higher number = higher priority)
    this.priorityLevels.set('error', 100);
    this.priorityLevels.set('warn', 80);
    this.priorityLevels.set('http', 60);
    this.priorityLevels.set('info', 40);
    this.priorityLevels.set('debug', 20);

    // Override with custom priorities
    if (options.priorityMap) {
      Object.entries(options.priorityMap).forEach(([level, priority]) => {
        this.priorityLevels.set(level, priority);
      });
    }
  }

  /* eslint-disable max-statements */
  shouldSample(entry: LogEntry, context: SamplingContext): boolean {
    this.processed++;

    const serviceName = this.extractServiceName(entry);
    let stats = this.serviceStats.get(serviceName);

    if (!stats) {
      stats = {
        serviceName,
        sampledCount: 0,
        totalCount: 0,
        lastSampledTime: 0,
        errorCount: 0,
        warningCount: 0,
      };
      this.serviceStats.set(serviceName, stats);
    }

    stats.totalCount++;

    if (entry.level === 'error') {
      stats.errorCount++;
    }
    if (entry.level === 'warn') {
      stats.warningCount++;
    }

    // Priority-based sampling
    const priority = this.priorityLevels.get(entry.level) ?? 0;
    const baseSamplingRate = this.calculateBaseRate(priority);

    // Adjust based on service-specific factors
    let adjustedRate = baseSamplingRate;

    // Increase sampling for services with high error rates
    const errorRate = stats.errorCount / stats.totalCount;
    if (errorRate > 0.05) {
      adjustedRate = Math.min(1.0, adjustedRate * 2);
    }

    // Decrease sampling for very high volume services
    const volumeRate = stats.totalCount / (context.currentTime / 60000); // per minute
    if (volumeRate > 1000) {
      adjustedRate *= 0.5;
    }

    const shouldSample = Math.random() < adjustedRate;

    if (shouldSample) {
      this.sampled++;
      stats.sampledCount++;
      stats.lastSampledTime = context.currentTime;
    }

    return shouldSample;
  }

  getStats(): SamplingStats {
    const serviceBreakdown: Record<string, { sampled: number; total: number; rate: number }> = {};

    for (const [service, stats] of this.serviceStats) {
      serviceBreakdown[service] = {
        sampled: stats.sampledCount,
        total: stats.totalCount,
        rate: stats.totalCount > 0 ? stats.sampledCount / stats.totalCount : 0,
      };
    }

    return {
      strategyName: this.name,
      totalProcessed: this.processed,
      totalSampled: this.sampled,
      samplingRate: this.processed > 0 ? this.sampled / this.processed : 0,
      serviceBreakdown,
    };
  }

  reset(): void {
    this.processed = 0;
    this.sampled = 0;
    this.serviceStats.clear();
  }

  private calculateBaseRate(priority: number): number {
    // Higher priority = higher sampling rate
    if (priority >= 100) {
      return 1.0;
    } // Always sample errors
    if (priority >= 80) {
      return 0.8;
    } // 80% for warnings
    if (priority >= 60) {
      return 0.5;
    } // 50% for HTTP logs
    if (priority >= 40) {
      return 0.2;
    } // 20% for info logs
    return 0.05; // 5% for debug logs
  }

  private extractServiceName(entry: LogEntry): string {
    if (typeof entry.meta === 'object' && entry.meta !== null) {
      const meta = entry.meta as Record<string, unknown>;
      return (meta['serviceName'] as string) || (meta['service'] as string) || 'unknown';
    }
    return 'unknown';
  }
}

export class BurstSamplingStrategy implements SamplingStrategy {
  name = 'burst-aware';
  private processed = 0;
  private sampled = 0;
  private readonly serviceStats = new Map<string, ServiceSamplingStats>();
  private readonly burstWindows = new Map<string, { count: number; startTime: number }>();
  private readonly burstThreshold = 50; // Messages per second considered a burst
  private readonly burstSamplingRate = 0.1; // 10% sampling during bursts
  private readonly normalSamplingRate = 0.5; // 50% sampling during normal operation

  /* eslint-disable max-statements */
  shouldSample(entry: LogEntry, context: SamplingContext): boolean {
    this.processed++;

    const serviceName = this.extractServiceName(entry);
    const now = context.currentTime;

    let stats = this.serviceStats.get(serviceName);
    if (!stats) {
      stats = {
        serviceName,
        sampledCount: 0,
        totalCount: 0,
        lastSampledTime: 0,
        errorCount: 0,
        warningCount: 0,
      };
      this.serviceStats.set(serviceName, stats);
    }

    stats.totalCount++;

    if (entry.level === 'error') {
      stats.errorCount++;
    }
    if (entry.level === 'warn') {
      stats.warningCount++;
    }

    // Burst detection
    let burstWindow = this.burstWindows.get(serviceName);
    if (!burstWindow || now - burstWindow.startTime > 1000) {
      // New 1-second window
      burstWindow = { count: 0, startTime: now };
      this.burstWindows.set(serviceName, burstWindow);
    }

    burstWindow.count++;

    // Determine if we're in a burst
    const isBurst = burstWindow.count >= this.burstThreshold;
    const samplingRate = isBurst ? this.burstSamplingRate : this.normalSamplingRate;

    // Always sample errors, even during bursts
    const shouldSample = entry.level === 'error' || Math.random() < samplingRate;

    if (shouldSample) {
      this.sampled++;
      stats.sampledCount++;
      stats.lastSampledTime = context.currentTime;
    }

    return shouldSample;
  }

  getStats(): SamplingStats {
    const serviceBreakdown: Record<string, { sampled: number; total: number; rate: number }> = {};

    for (const [service, stats] of this.serviceStats) {
      serviceBreakdown[service] = {
        sampled: stats.sampledCount,
        total: stats.totalCount,
        rate: stats.totalCount > 0 ? stats.sampledCount / stats.totalCount : 0,
      };
    }

    return {
      strategyName: this.name,
      totalProcessed: this.processed,
      totalSampled: this.sampled,
      samplingRate: this.processed > 0 ? this.sampled / this.processed : 0,
      serviceBreakdown,
    };
  }

  reset(): void {
    this.processed = 0;
    this.sampled = 0;
    this.serviceStats.clear();
    this.burstWindows.clear();
  }

  private extractServiceName(entry: LogEntry): string {
    if (typeof entry.meta === 'object' && entry.meta !== null) {
      const meta = entry.meta as Record<string, unknown>;
      return (meta['serviceName'] as string) || (meta['service'] as string) || 'unknown';
    }
    return 'unknown';
  }
}

export class SamplingStrategyManager {
  private readonly strategies = new Map<string, SamplingStrategy>();
  private activeStrategy: SamplingStrategy | null = null;
  private readonly context: SamplingContext;

  constructor() {
    this.context = {
      totalProcessed: 0,
      currentTime: Date.now(),
      recentEntries: [],
      serviceStats: new Map(),
    };

    // Register built-in strategies
    this.registerStrategy(new AdaptiveSamplingStrategy());
    this.registerStrategy(new PriorityBasedSamplingStrategy());
    this.registerStrategy(new BurstSamplingStrategy());
  }

  registerStrategy(strategy: SamplingStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  setActiveStrategy(name: string): void {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Sampling strategy '${name}' not registered`);
    }
    this.activeStrategy = strategy;
  }

  shouldSample(entry: LogEntry): boolean {
    if (!this.activeStrategy) {
      return true; // No sampling by default
    }

    // Update context
    this.context.totalProcessed++;
    this.context.currentTime = Date.now();
    this.context.recentEntries.push(entry);
    if (this.context.recentEntries.length > 100) {
      this.context.recentEntries = this.context.recentEntries.slice(-100);
    }

    return this.activeStrategy.shouldSample(entry, this.context);
  }

  getStats(): SamplingStats | null {
    return this.activeStrategy?.getStats() ?? null;
  }

  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  reset(): void {
    for (const strategy of this.strategies.values()) {
      strategy.reset();
    }
    this.context.recentEntries = [];
    this.context.totalProcessed = 0;
  }
}

// Global instance
export const samplingManager = new SamplingStrategyManager();
