/**
 * Comprehensive Metrics Collection - Medium Priority Implementation
 * Performance monitoring, throughput tracking, and alerting
 */

import { EventEmitter } from 'events';

import type { AsyncQueueStats } from './async-logging-queue';

export type MetricsConfig = {
  enableMetrics: boolean;
  metricsInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    errorRate: number;
    throughputDrop: number;
    queueSize: number;
    deadLetterGrowth: number;
  };
};

export type PerformanceMetrics = {
  timestamp: number;
  throughputPerSecond: number;
  avgProcessingTime: number;
  errorRate: number;
  queueSize: number;
  retryQueueSize: number;
  deadLetterCount: number;
  guaranteedDeliveryRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: number;
};

export type AlertCondition = {
  type: 'error_rate' | 'throughput_drop' | 'queue_size' | 'dead_letter_growth' | 'custom';
  threshold: number;
  currentValue: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  customMetricName?: string;
};

export type CustomMetricDefinition = {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description?: string;
  labels?: Record<string, string>;
  buckets?: number[]; // For histograms
};

export type CustomMetricValue = {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
};

export class MetricsCollector extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private alerts: AlertCondition[] = [];
  private timer?: NodeJS.Timeout;
  private lastMetrics?: PerformanceMetrics;

  // Custom metrics storage
  private readonly customMetrics: Map<string, CustomMetricDefinition> = new Map();
  private readonly customValues: Map<string, CustomMetricValue[]> = new Map();
  private readonly counters: Map<string, number> = new Map();
  private readonly gauges: Map<string, number> = new Map();
  private readonly histograms: Map<
    string,
    { buckets: number[]; counts: number[]; sum: number; count: number }
  > = new Map();

  constructor(
    private readonly config: MetricsConfig,
    private readonly getCurrentStats: () => AsyncQueueStats
  ) {
    super();
    if (this.config.enableMetrics) {
      this.startCollection();
    }
  }

  /**
   * Start metrics collection
   */
  private startCollection(): void {
    this.timer = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.cleanupOldMetrics();
    }, this.config.metricsInterval);
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    const stats = this.getCurrentStats();
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      throughputPerSecond: stats.throughputPerSecond || 0,
      avgProcessingTime: stats.avgProcessingTime || 0,
      errorRate: stats.errorRate || 0,
      queueSize: stats.queueSize || 0,
      retryQueueSize: stats.retryQueueSize || 0,
      deadLetterCount: stats.deadLetterCount || 0,
      guaranteedDeliveryRate: stats.guaranteedDeliveryRate || 100,
      memoryUsage: process.memoryUsage(),
    };

    this.metrics.push(metrics);
    this.lastMetrics = metrics;
    this.emit('metrics-collected', metrics);
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(): void {
    if (!this.lastMetrics) {
      return;
    }

    const metrics = this.lastMetrics;

    // Check error rate
    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert('error_rate', metrics.errorRate, this.config.alertThresholds.errorRate);
    }

    // Check throughput drop (compare with recent average)
    const recentThroughput = this.getRecentAverage('throughputPerSecond', 5);
    if (
      recentThroughput > 0 &&
      metrics.throughputPerSecond <
        recentThroughput * (1 - this.config.alertThresholds.throughputDrop / 100)
    ) {
      this.createAlert('throughput_drop', metrics.throughputPerSecond, recentThroughput);
    }

    // Check queue size
    if (metrics.queueSize > this.config.alertThresholds.queueSize) {
      this.createAlert('queue_size', metrics.queueSize, this.config.alertThresholds.queueSize);
    }

    // Check dead letter growth
    const recentDeadLetter = this.getRecentAverage('deadLetterCount', 5);
    if (metrics.deadLetterCount > recentDeadLetter + this.config.alertThresholds.deadLetterGrowth) {
      this.createAlert('dead_letter_growth', metrics.deadLetterCount, recentDeadLetter);
    }
  }

  /**
   * Create an alert condition
   */
  private createAlert(type: AlertCondition['type'], currentValue: number, threshold: number): void {
    const severity = this.calculateSeverity(type, currentValue, threshold);
    const alert: AlertCondition = {
      type,
      threshold,
      currentValue,
      timestamp: Date.now(),
      severity,
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Calculate alert severity
   */
  private calculateSeverity(
    _type: AlertCondition['type'],
    currentValue: number,
    threshold: number
  ): AlertCondition['severity'] {
    const ratio = currentValue / threshold;

    if (ratio >= 2) {
      return 'critical';
    }
    if (ratio >= 1.5) {
      return 'high';
    }
    if (ratio >= 1.2) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get recent average for a metric
   */
  private getRecentAverage(metric: keyof PerformanceMetrics, count: number): number {
    const recent = this.metrics.slice(-count);
    if (recent.length === 0) {
      return 0;
    }

    const sum = recent.reduce((accumulator, m) => accumulator + ((m[metric] as number) || 0), 0);
    return sum / recent.length;
  }

  /**
   * Clean up old metrics data
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    current: PerformanceMetrics | null;
    averages: Partial<PerformanceMetrics>;
    alerts: AlertCondition[];
    trends: {
      throughputTrend: 'increasing' | 'decreasing' | 'stable';
      errorRateTrend: 'increasing' | 'decreasing' | 'stable';
      queueSizeTrend: 'increasing' | 'decreasing' | 'stable';
    };
  } {
    const recent = this.metrics.slice(-10); // Last 10 measurements

    const averages =
      recent.length > 0
        ? {
            throughputPerSecond:
              recent.reduce((sum, m) => sum + m.throughputPerSecond, 0) / recent.length,
            avgProcessingTime:
              recent.reduce((sum, m) => sum + m.avgProcessingTime, 0) / recent.length,
            errorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length,
            queueSize: recent.reduce((sum, m) => sum + m.queueSize, 0) / recent.length,
            retryQueueSize: recent.reduce((sum, m) => sum + m.retryQueueSize, 0) / recent.length,
            deadLetterCount: recent.reduce((sum, m) => sum + m.deadLetterCount, 0) / recent.length,
            guaranteedDeliveryRate:
              recent.reduce((sum, m) => sum + m.guaranteedDeliveryRate, 0) / recent.length,
          }
        : {};

    const trends = this.calculateTrends(recent);

    return {
      current: this.lastMetrics || null,
      averages,
      alerts: [...this.alerts],
      trends,
    };
  }

  /**
   * Calculate metric trends
   */
  private calculateTrends(recent: PerformanceMetrics[]): {
    throughputTrend: 'increasing' | 'decreasing' | 'stable';
    errorRateTrend: 'increasing' | 'decreasing' | 'stable';
    queueSizeTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (recent.length < 5) {
      return {
        throughputTrend: 'stable',
        errorRateTrend: 'stable',
        queueSizeTrend: 'stable',
      };
    }

    const calcTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
      const firstAvg =
        values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) /
        Math.floor(values.length / 2);
      const secondAvg =
        values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) /
        Math.floor(values.length / 2);
      const diff = ((secondAvg - firstAvg) / firstAvg) * 100;

      if (diff > 10) {
        return 'increasing';
      }
      if (diff < -10) {
        return 'decreasing';
      }
      return 'stable';
    };

    return {
      throughputTrend: calcTrend(recent.map((m) => m.throughputPerSecond)),
      errorRateTrend: calcTrend(recent.map((m) => m.errorRate)),
      queueSizeTrend: calcTrend(recent.map((m) => m.queueSize)),
    };
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsRange(startTime: number, endTime: number): PerformanceMetrics[] {
    return this.metrics.filter((m) => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Export metrics data
   */
  exportMetrics(): {
    metrics: PerformanceMetrics[];
    alerts: AlertCondition[];
    customMetrics: CustomMetricValue[];
  } {
    const customMetrics: CustomMetricValue[] = [];
    for (const values of this.customValues.values()) {
      customMetrics.push(...values);
    }

    return {
      metrics: [...this.metrics],
      alerts: [...this.alerts],
      customMetrics,
    };
  }

  /**
   * Register a custom metric
   */
  registerCustomMetric(definition: CustomMetricDefinition): void {
    this.customMetrics.set(definition.name, definition);

    switch (definition.type) {
      case 'counter':
        this.counters.set(definition.name, 0);
        break;
      case 'gauge':
        this.gauges.set(definition.name, 0);
        break;
      case 'histogram':
        this.histograms.set(definition.name, {
          buckets: definition.buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
          counts: new Array(
            (definition.buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10])
              .length + 1
          ).fill(0),
          sum: 0,
          count: 0,
        });
        break;
    }
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value = 1, labels?: Record<string, string>): void {
    const definition = this.customMetrics.get(name);
    if (definition?.type !== 'counter') {
      throw new Error(`Counter metric '${name}' not registered or wrong type`);
    }

    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);

    this.recordCustomValue(name, current + value, labels);
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const definition = this.customMetrics.get(name);
    if (definition?.type !== 'gauge') {
      throw new Error(`Gauge metric '${name}' not registered or wrong type`);
    }

    this.gauges.set(name, value);
    this.recordCustomValue(name, value, labels);
  }

  /**
   * Observe a value for a histogram metric
   */
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const definition = this.customMetrics.get(name);
    if (definition?.type !== 'histogram') {
      throw new Error(`Histogram metric '${name}' not registered or wrong type`);
    }

    const histogram = this.histograms.get(name);
    if (!histogram) {
      throw new Error(`Histogram '${name}' not initialized`);
    }

    // Update sum and count
    histogram.sum += value;
    histogram.count++;

    // Find the appropriate bucket and increment its count
    let bucketIndex = histogram.buckets.length; // Default to last bucket (values > max)
    for (let index = 0; index < histogram.buckets.length; index++) {
      if (value <= histogram.buckets[index]!) {
        bucketIndex = index;
        break;
      }
    }
    const currentCount = histogram.counts[bucketIndex] ?? 0;
    histogram.counts[bucketIndex] = currentCount + 1;

    // Record the custom value with labels
    this.recordCustomValue(name, value, labels);
  }

  /**
   * Get current values of all custom metrics
   */
  getCustomMetrics(): Record<
    string,
    { value: number; type: string; labels?: Record<string, string> }
  > {
    const result: Record<string, { value: number; type: string; labels?: Record<string, string> }> =
      {};

    for (const [name, definition] of this.customMetrics) {
      let value = 0;
      switch (definition.type) {
        case 'counter':
          value = this.counters.get(name) || 0;
          break;
        case 'gauge':
          value = this.gauges.get(name) || 0;
          break;
        case 'histogram': {
          const histogram = this.histograms.get(name);
          if (!histogram) {
            throw new Error(`Histogram ${name} not found`);
          }
          value = histogram.count > 0 ? histogram.sum / histogram.count : 0;
          break;
        }
      }

      result[name] = {
        value,
        type: definition.type,
        labels: definition.labels || {},
      };
    }

    return result;
  }

  /**
   * Get custom metric values for a time range
   */
  getCustomMetricsRange(name: string, startTime: number, endTime: number): CustomMetricValue[] {
    const values = this.customValues.get(name) || [];
    return values.filter((v) => v.timestamp >= startTime && v.timestamp <= endTime);
  }

  /**
   * Set up alerting for custom metrics
   */
  setCustomMetricAlert(
    name: string,
    threshold: number,
    condition: 'above' | 'below' | 'equals'
  ): void {
    // This would be called during metrics collection to check custom metric alerts
    const definition = this.customMetrics.get(name);
    if (!definition) {
      throw new Error(`Custom metric '${name}' not registered`);
    }

    // Store alert configuration for checking during collection
    this.emit('custom-alert-configured', { name, threshold, condition });
  }

  /**
   * Record a custom metric value
   */
  private recordCustomValue(name: string, value: number, labels?: Record<string, string>): void {
    const customValue: CustomMetricValue = {
      name,
      value,
      timestamp: Date.now(),
      labels: labels || {},
    };

    if (!this.customValues.has(name)) {
      this.customValues.set(name, []);
    }

    this.customValues.get(name)!.push(customValue);

    // Keep only recent values (configurable retention)
    const values = this.customValues.get(name)!;
    if (values.length > 1000) {
      // Keep last 1000 values
      this.customValues.set(name, values.slice(-1000));
    }

    this.emit('custom-metric-recorded', customValue);
  }

  /**
   * Shutdown metrics collection
   */
  shutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined!;
    }
    this.emit('shutdown');
  }
}
