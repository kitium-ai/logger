/**
 * Centralized Logging System
 * Enterprise-ready structured logging with Loki integration
 */

// Main logger exports
export { CentralLogger, initializeLogger, getLogger } from './logger/logger';

// Logger interface
export type { ILogger, LogEntry } from './logger/logger.interface';

// Logger implementations
export { InMemoryLogger } from './logger/in-memory-logger';
export { ConsoleLogger } from './logger/console-logger';
export { FileLogger } from './logger/file-logger';

// Logger factory and builder
export {
  LoggerFactory,
  LoggerBuilder,
  LoggerType,
  initGlobalLogger,
  getGlobalLogger,
} from './logger/logger-factory';
export type { LoggerFactoryOptions } from './logger/logger-factory';

// Configuration exports
export { getLoggerConfig, LogLevel, LoggerConfig, LokiConfig } from './config/logger.config';

// Context management exports
export { contextManager, LogContext } from './context/async-context';

// Middleware exports
export {
  tracingMiddleware,
  errorLoggingMiddleware,
  bodyLoggingMiddleware,
  performanceMetricsMiddleware,
  userContextMiddleware,
  addMetadata,
  sanitizeData,
} from './middleware/express-middleware';

// Utility exports
export {
  createTimer,
  withErrorLogging,
  withErrorLoggingSync,
  logFunctionCall,
  LoggableError,
  BatchLogger,
  auditLog,
  StructuredLogEntry,
} from './utils/logger-utils';

// Error handling exports
export {
  retryWithBackoff,
  CircuitBreaker,
  safeAsync,
  withGracefulDegradation,
} from './utils/error-handler';
export type { RetryConfig } from './utils/error-handler';

// Metrics exports
export {
  Gauge,
  Counter,
  Histogram,
  MetricsRegistry,
  getMetricsRegistry,
  loggerMetrics,
} from './utils/metrics';
export type { MetricValue, MetricLabels } from './utils/metrics';

// Configuration validation exports
export {
  validateLoggerConfig,
  assertValidConfig,
  parseFileSize,
  ConfigValidationError,
} from './config/config-validator';
export type { ValidationResult } from './config/config-validator';

// Health check exports
export {
  performHealthCheck,
  healthCheckMiddleware,
  getHealthStatusMessage,
  HealthStatus,
} from './utils/health-check';
export type { HealthCheckResult } from './utils/health-check';

// Re-export common types
export type { Request, Response, NextFunction } from 'express';
