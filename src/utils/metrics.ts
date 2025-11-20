/**
 * Prometheus-compatible metrics collector
 * This module provides metrics collection for observability
 */

export interface MetricValue {
  timestamp: number;
  value: number;
}

export interface MetricLabels {
  [key: string]: string;
}

export class Gauge {
  private value = 0;
  private labelsMap = new Map<string, number>();

  constructor(
    readonly name: string,
    readonly help: string,
  ) {}

  set(value: number, labels?: MetricLabels): void {
    if (labels) {
      const key = this.labelsToKey(labels);
      this.labelsMap.set(key, value);
    } else {
      this.value = value;
    }
  }

  inc(amount = 1, labels?: MetricLabels): void {
    if (labels) {
      const key = this.labelsToKey(labels);
      this.labelsMap.set(key, (this.labelsMap.get(key) ?? 0) + amount);
    } else {
      this.value += amount;
    }
  }

  dec(amount = 1, labels?: MetricLabels): void {
    this.inc(-amount, labels);
  }

  get(): number {
    return this.value;
  }

  private labelsToKey(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  toString(): string {
    let output = `# HELP ${this.name} ${this.help}\n`;
    output += `# TYPE ${this.name} gauge\n`;
    output += `${this.name} ${this.value}\n`;

    for (const [key, value] of this.labelsMap.entries()) {
      const labels = JSON.parse(key);
      const labelsStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      output += `${this.name}{${labelsStr}} ${value}\n`;
    }

    return output;
  }
}

export class Counter {
  private value = 0;
  private labelsMap = new Map<string, number>();

  constructor(
    readonly name: string,
    readonly help: string,
  ) {}

  inc(amount = 1, labels?: MetricLabels): void {
    if (amount < 0) {
      throw new Error('Counter can only be incremented, not decremented');
    }

    if (labels) {
      const key = this.labelsToKey(labels);
      this.labelsMap.set(key, (this.labelsMap.get(key) ?? 0) + amount);
    } else {
      this.value += amount;
    }
  }

  get(): number {
    return this.value;
  }

  private labelsToKey(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  toString(): string {
    let output = `# HELP ${this.name} ${this.help}\n`;
    output += `# TYPE ${this.name} counter\n`;
    output += `${this.name} ${this.value}\n`;

    for (const [key, value] of this.labelsMap.entries()) {
      const labels = JSON.parse(key);
      const labelsStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      output += `${this.name}{${labelsStr}} ${value}\n`;
    }

    return output;
  }
}

export class Histogram {
  private buckets: number[] = [];
  private sum = 0;
  private count = 0;

  constructor(
    readonly name: string,
    readonly help: string,
    buckets?: number[],
  ) {
    this.buckets = buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  }

  observe(value: number): void {
    this.sum += value;
    this.count += 1;
  }

  toString(): string {
    let output = `# HELP ${this.name} ${this.help}\n`;
    output += `# TYPE ${this.name} histogram\n`;
    output += `${this.name}_sum ${this.sum}\n`;
    output += `${this.name}_count ${this.count}\n`;
    return output;
  }
}

/**
 * Global metrics registry
 */
export class MetricsRegistry {
  private metrics = new Map<string, Gauge | Counter | Histogram>();

  registerGauge(name: string, help: string): Gauge {
    const gauge = new Gauge(name, help);
    this.metrics.set(name, gauge);
    return gauge;
  }

  registerCounter(name: string, help: string): Counter {
    const counter = new Counter(name, help);
    this.metrics.set(name, counter);
    return counter;
  }

  registerHistogram(name: string, help: string, buckets?: number[]): Histogram {
    const histogram = new Histogram(name, help, buckets);
    this.metrics.set(name, histogram);
    return histogram;
  }

  getMetric(name: string): Gauge | Counter | Histogram | undefined {
    return this.metrics.get(name);
  }

  getMetrics(): Map<string, Gauge | Counter | Histogram> {
    return this.metrics;
  }

  toString(): string {
    let output = '';
    for (const metric of this.metrics.values()) {
      output += metric.toString() + '\n';
    }
    return output;
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Global registry instance
const globalRegistry = new MetricsRegistry();

// Logger-specific metrics
export const loggerMetrics = {
  logCounter: globalRegistry.registerCounter(
    'logger_logs_total',
    'Total number of log entries created',
  ),
  errorCounter: globalRegistry.registerCounter(
    'logger_errors_total',
    'Total number of error logs',
  ),
  lokiBatchLatency: globalRegistry.registerHistogram(
    'logger_loki_batch_latency_seconds',
    'Latency of Loki batch uploads in seconds',
  ),
  memoryUsage: globalRegistry.registerGauge(
    'logger_memory_usage_bytes',
    'Logger memory usage in bytes',
  ),
  dropgedLogs: globalRegistry.registerCounter(
    'logger_dropped_logs_total',
    'Total number of dropped logs due to load',
  ),
};

export function getMetricsRegistry(): MetricsRegistry {
  return globalRegistry;
}
