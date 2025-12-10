// eslint-disable-next-line no-restricted-imports
import type { AlertCondition, PerformanceMetrics } from '../../utils/metrics-collector';

/**
 * Metrics Logger Interface
 * Provides access to performance metrics and monitoring data
 */
export type IMetricsLogger = {
  /**
   * Get current metrics summary including averages, alerts, and trends
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
  };

  /**
   * Get metrics for a specific time range
   * @param startTime - Start timestamp in milliseconds
   * @param endTime - End timestamp in milliseconds
   */
  getMetricsRange(startTime: number, endTime: number): PerformanceMetrics[];

  /**
   * Export all metrics data including alerts and custom metrics
   */
  exportMetrics(): {
    metrics: PerformanceMetrics[];
    alerts: AlertCondition[];
    customMetrics?: unknown[];
  };
};
