/**
 * Centralized Logging System
 * Enterprise-ready structured logging with Loki integration
 */

// Main logger exports
export { createLogger } from './logger/create-logger';
export { CentralLogger, getLogger, initializeLogger } from './logger/logger';

// Logger interfaces (segregated by capability for SOLID compliance)
export type {
  IAdvancedLogger,
  IContextualLogger,
  ICoreLogger,
  IFullFeaturedLogger,
  ILogger,
  IMetricsLogger,
  IQueueLogger,
  ISearchableLogger,
  LogEntry,
} from './logger/logger.interface';

// Logger implementations
export { ConsoleLogger } from './logger/console-logger';
export { FileLogger } from './logger/file-logger';
export { InMemoryLogger } from './logger/in-memory-logger';

// Logger factory and builder
export type { LoggerFactoryOptions } from './logger/logger-factory';
export {
  getGlobalLogger,
  initGlobalLogger,
  LoggerBuilder,
  LoggerFactory,
  LoggerType,
} from './logger/logger-factory';

// Configuration exports
export type { LoggerConfig, LoggerPreset, LokiConfig } from './config/logger.config';
export { getLoggerConfig, getPresetConfig, LogLevel } from './config/logger.config';

// Context management exports
export type { LogContext } from './context/async-context';
export { contextManager } from './context/async-context';
export {
  bridgeExpressRequest,
  bridgeHeadersToContext,
  bridgeNextRequest,
  bridgeOpenTelemetryContext,
} from './context/context-bridges';
export type { HeaderGetter, IncomingTraceContext } from './context/trace-context-extractor';
export { TraceContextExtractor } from './context/trace-context-extractor';

// Middleware exports
export {
  addMetadata,
  bodyLoggingMiddleware,
  errorLoggingMiddleware,
  performanceMetricsMiddleware,
  sanitizeData,
  tracingMiddleware,
  userContextMiddleware,
} from './middleware/express-middleware';
export {
  createNestExceptionFilter,
  createNestLoggingMiddleware,
  NestLoggerMiddleware,
} from './middleware/nest-logger.middleware';
export {
  createNextFetchWrapper,
  withNextApiLogger,
  withNextRouteLogger,
} from './middleware/next-middleware';

// Utility exports
export type { StructuredLogEntry } from './utils/logger-utils';
export {
  auditLog,
  BatchLogger,
  createTimer,
  logFunctionCall,
  LoggableError,
  withErrorLogging,
  withErrorLoggingSync,
  withLoggingContext,
} from './utils/logger-utils';

// PII detection and sanitization exports
export {
  detectPIITypes,
  isSensitiveField,
  isSensitiveValue,
  PIIPatterns,
  redactValue,
  sanitizeObject,
  SENSITIVE_FIELDS,
  SENSITIVE_VALUE_PATTERNS,
} from './utils/pii-patterns';

// Console capture exports
export type {
  ConsoleCapture,
  ConsoleCaptureEntry,
  ConsoleCaptureOptions,
} from './utils/console-capture';
export { captureConsole, restoreConsole } from './utils/console-capture';

// Error handling exports
export type { RetryConfig } from './utils/error-handler';
export {
  CircuitBreaker,
  retryWithBackoff,
  safeAsync,
  withGracefulDegradation,
} from './utils/error-handler';

// Metrics exports
export type { MetricLabels, MetricValue } from './utils/metrics';
export {
  Counter,
  Gauge,
  getMetricsRegistry,
  Histogram,
  loggerMetrics,
  MetricsRegistry,
} from './utils/metrics';

// Configuration validation exports
export type { ValidationResult } from './config/config-validator';
export {
  assertValidConfig,
  ConfigValidationError,
  parseFileSize,
  validateLoggerConfig,
} from './config/config-validator';

// Health check exports
export type { HealthCheckResult } from './utils/health-check';
export {
  getHealthStatusMessage,
  healthCheckMiddleware,
  HealthStatus,
  performHealthCheck,
} from './utils/health-check';

// Re-export common types
export type { NextFunction, Request, Response } from 'express';
