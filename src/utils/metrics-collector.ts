/**
 * Comprehensive Metrics Collection - Medium Priority Implementation
 * Performance monitoring, throughput tracking, and alerting
 */

import { EventEmitter } from 'events';

export interface MetricsConfig {
  enableMetrics: boolean;
  metricsInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    errorRate: number;
    throughputDrop: number;
    queueSize: number;
    deadLetterGrowth: number;
  };
}

export interface PerformanceMetrics {
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
}

export interface AlertCondition {
  type: 'error_rate' | 'throughput_drop' | 'queue_size' | 'dead_letter_growth';
  threshold: number;
  currentValue: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class MetricsCollector extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private alerts: AlertCondition[] = [];
  private timer?: NodeJS.Timeout;
  private lastMetrics?: PerformanceMetrics;

  constructor(
    private config: MetricsConfig,
    private getCurrentStats: () => any
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
    if (!this.lastMetrics) return;

    const metrics = this.lastMetrics;

    // Check error rate
    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert('error_rate', metrics.errorRate, this.config.alertThresholds.errorRate);
    }

    // Check throughput drop (compare with recent average)
    const recentThroughput = this.getRecentAverage('throughputPerSecond', 5);
    if (recentThroughput > 0 && metrics.throughputPerSecond < recentThroughput * (1 - this.config.alertThresholds.throughputDrop / 100)) {
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
  private calculateSeverity(_type: AlertCondition['type'], currentValue: number, threshold: number): AlertCondition['severity'] {
    const ratio = currentValue / threshold;

    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }

  /**
   * Get recent average for a metric
   */
  private getRecentAverage(metric: keyof PerformanceMetrics, count: number): number {
    const recent = this.metrics.slice(-count);
    if (recent.length === 0) return 0;

    const sum = recent.reduce((acc, m) => acc + (m[metric] as number || 0), 0);
    return sum / recent.length;
  }

  /**
   * Clean up old metrics data
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
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

    const averages = recent.length > 0 ? {
      throughputPerSecond: recent.reduce((sum, m) => sum + m.throughputPerSecond, 0) / recent.length,
      avgProcessingTime: recent.reduce((sum, m) => sum + m.avgProcessingTime, 0) / recent.length,
      errorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length,
      queueSize: recent.reduce((sum, m) => sum + m.queueSize, 0) / recent.length,
      retryQueueSize: recent.reduce((sum, m) => sum + m.retryQueueSize, 0) / recent.length,
      deadLetterCount: recent.reduce((sum, m) => sum + m.deadLetterCount, 0) / recent.length,
      guaranteedDeliveryRate: recent.reduce((sum, m) => sum + m.guaranteedDeliveryRate, 0) / recent.length,
    } : {};

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
  private calculateTrends(recent: PerformanceMetrics[]): any {
    if (recent.length < 5) {
      return {
        throughputTrend: 'stable',
        errorRateTrend: 'stable',
        queueSizeTrend: 'stable',
      };
    }

    const calcTrend = (values: number[]) => {
      const firstAvg = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2);
      const secondAvg = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 2);
      const diff = ((secondAvg - firstAvg) / firstAvg) * 100;

      if (diff > 10) return 'increasing';
      if (diff < -10) return 'decreasing';
      return 'stable';
    };

    return {
      throughputTrend: calcTrend(recent.map(m => m.throughputPerSecond)),
      errorRateTrend: calcTrend(recent.map(m => m.errorRate)),
      queueSizeTrend: calcTrend(recent.map(m => m.queueSize)),
    };
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsRange(startTime: number, endTime: number): PerformanceMetrics[] {
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Export metrics data
   */
  exportMetrics(): { metrics: PerformanceMetrics[]; alerts: AlertCondition[] } {
    return {
      metrics: [...this.metrics],
      alerts: [...this.alerts],
    };
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