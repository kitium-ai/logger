/**
 * Logger Configuration Builder
 * Centralized configuration creation for logger components
 * Extracts environment variable parsing logic from logger constructors
 */

import type { AsyncQueueConfig } from '../utils/async-logging-queue';
import type { SecurityConfig } from '../utils/enhanced-security';
import type { MetricsConfig } from '../utils/metrics-collector';
import type { HealthMonitorConfig } from '../utils/transport-health-monitor';

/**
 * Build async queue configuration from environment variables
 */
export function buildQueueConfig(): AsyncQueueConfig {
  return {
    maxQueueSize: parseInt(process.env['LOG_QUEUE_SIZE'] ?? '10000'),
    flushInterval: parseInt(process.env['LOG_FLUSH_INTERVAL'] ?? '5000'),
    maxRetries: parseInt(process.env['LOG_MAX_RETRIES'] ?? '3'),
    retryDelay: parseInt(process.env['LOG_RETRY_DELAY'] ?? '1000'),
    enablePersistence: process.env['LOG_ENABLE_PERSISTENCE'] === 'true',
    persistencePath: process.env['LOG_PERSISTENCE_PATH'] ?? './logs/queue',
    enableGuaranteedDelivery: process.env['LOG_ENABLE_GUARANTEED_DELIVERY'] !== 'false',
    deadLetterQueuePath: process.env['LOG_DEAD_LETTER_PATH'] ?? './logs/dead-letter',
    maxDeadLetterSize: parseInt(process.env['LOG_MAX_DEAD_LETTER_SIZE'] ?? '1000'),
    retryBackoffMultiplier: parseFloat(process.env['LOG_RETRY_BACKOFF_MULTIPLIER'] ?? '2'),
    maxRetryDelay: parseInt(process.env['LOG_MAX_RETRY_DELAY'] ?? '30000'),
  };
}

/**
 * Build health monitor configuration from environment variables
 */
export function buildHealthConfig(): HealthMonitorConfig {
  return {
    healthCheckInterval: parseInt(process.env['LOG_HEALTH_CHECK_INTERVAL'] ?? '30000'),
    failureThreshold: parseInt(process.env['LOG_FAILURE_THRESHOLD'] ?? '5'),
    recoveryThreshold: parseInt(process.env['LOG_RECOVERY_THRESHOLD'] ?? '2'),
    circuitBreakerTimeout: parseInt(process.env['LOG_CIRCUIT_BREAKER_TIMEOUT'] ?? '60000'),
    enableAutoFailover: process.env['LOG_ENABLE_AUTO_FAILOVER'] !== 'false',
  };
}

/**
 * Build security configuration from environment variables
 */
export function buildSecurityConfig(): SecurityConfig {
  const config: SecurityConfig = {
    enablePIIDetection: process.env['LOG_ENABLE_PII_DETECTION'] !== 'false',
    enableEncryption: process.env['LOG_ENABLE_ENCRYPTION'] === 'true',
    enableAuditSigning: process.env['LOG_ENABLE_AUDIT_SIGNING'] === 'true',
    piiFields: (process.env['LOG_PII_FIELDS'] ?? 'password,token,secret,email,phone,ssn').split(
      ','
    ),
  };

  if (process.env['LOG_ENCRYPTION_KEY']) {
    config.encryptionKey = process.env['LOG_ENCRYPTION_KEY'];
  }

  if (process.env['LOG_AUDIT_KEY']) {
    config.auditKey = process.env['LOG_AUDIT_KEY'];
  }

  return config;
}

/**
 * Build metrics collector configuration from environment variables
 */
export function buildMetricsConfig(): MetricsConfig {
  return {
    enableMetrics: process.env['LOG_ENABLE_METRICS'] !== 'false',
    metricsInterval: parseInt(process.env['LOG_METRICS_INTERVAL'] ?? '10000'),
    retentionPeriod: parseInt(process.env['LOG_METRICS_RETENTION'] ?? '3600000'), // 1 hour
    alertThresholds: {
      errorRate: parseFloat(process.env['LOG_ALERT_ERROR_RATE'] ?? '5'),
      throughputDrop: parseFloat(process.env['LOG_ALERT_THROUGHPUT_DROP'] ?? '20'),
      queueSize: parseInt(process.env['LOG_ALERT_QUEUE_SIZE'] ?? '5000'),
      deadLetterGrowth: parseInt(process.env['LOG_ALERT_DEAD_LETTER_GROWTH'] ?? '10'),
    },
  };
}

/**
 * LoggerConfigBuilder - Static utility class for building logger configurations
 */
export class LoggerConfigBuilder {
  static buildQueueConfig = buildQueueConfig;
  static buildHealthConfig = buildHealthConfig;
  static buildSecurityConfig = buildSecurityConfig;
  static buildMetricsConfig = buildMetricsConfig;

  /**
   * Build all configurations at once
   */
  static buildAll(): {
    queue: AsyncQueueConfig;
    health: HealthMonitorConfig;
    security: SecurityConfig;
    metrics: MetricsConfig;
  } {
    return {
      queue: buildQueueConfig(),
      health: buildHealthConfig(),
      security: buildSecurityConfig(),
      metrics: buildMetricsConfig(),
    };
  }
}
