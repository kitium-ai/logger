/**
 * Centralized Logging System
 * Enterprise-ready structured logging with Loki integration
 */

// Main logger exports
export { CentralLogger, initializeLogger, getLogger } from './logger/logger';

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

// Re-export common types
export type { Request, Response, NextFunction } from 'express';
