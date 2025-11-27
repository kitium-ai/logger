"use strict";
/**
 * Centralized Logging System
 * Enterprise-ready structured logging with Loki integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFileSize = exports.assertValidConfig = exports.validateLoggerConfig = exports.loggerMetrics = exports.getMetricsRegistry = exports.MetricsRegistry = exports.Histogram = exports.Counter = exports.Gauge = exports.withGracefulDegradation = exports.safeAsync = exports.CircuitBreaker = exports.retryWithBackoff = exports.restoreConsole = exports.captureConsole = exports.withLoggingContext = exports.auditLog = exports.BatchLogger = exports.LoggableError = exports.logFunctionCall = exports.withErrorLoggingSync = exports.withErrorLogging = exports.createTimer = exports.createNestExceptionFilter = exports.createNestLoggingMiddleware = exports.NestLoggerMiddleware = exports.createNextFetchWrapper = exports.withNextRouteLogger = exports.withNextApiLogger = exports.sanitizeData = exports.addMetadata = exports.userContextMiddleware = exports.performanceMetricsMiddleware = exports.bodyLoggingMiddleware = exports.errorLoggingMiddleware = exports.tracingMiddleware = exports.contextManager = exports.LogLevel = exports.getLoggerConfig = exports.getGlobalLogger = exports.initGlobalLogger = exports.LoggerType = exports.LoggerBuilder = exports.LoggerFactory = exports.FileLogger = exports.ConsoleLogger = exports.InMemoryLogger = exports.getLogger = exports.initializeLogger = exports.CentralLogger = void 0;
exports.HealthStatus = exports.getHealthStatusMessage = exports.healthCheckMiddleware = exports.performHealthCheck = exports.ConfigValidationError = void 0;
// Main logger exports
var logger_1 = require("./logger/logger");
Object.defineProperty(exports, "CentralLogger", { enumerable: true, get: function () { return logger_1.CentralLogger; } });
Object.defineProperty(exports, "initializeLogger", { enumerable: true, get: function () { return logger_1.initializeLogger; } });
Object.defineProperty(exports, "getLogger", { enumerable: true, get: function () { return logger_1.getLogger; } });
// Logger implementations
var in_memory_logger_1 = require("./logger/in-memory-logger");
Object.defineProperty(exports, "InMemoryLogger", { enumerable: true, get: function () { return in_memory_logger_1.InMemoryLogger; } });
var console_logger_1 = require("./logger/console-logger");
Object.defineProperty(exports, "ConsoleLogger", { enumerable: true, get: function () { return console_logger_1.ConsoleLogger; } });
var file_logger_1 = require("./logger/file-logger");
Object.defineProperty(exports, "FileLogger", { enumerable: true, get: function () { return file_logger_1.FileLogger; } });
// Logger factory and builder
var logger_factory_1 = require("./logger/logger-factory");
Object.defineProperty(exports, "LoggerFactory", { enumerable: true, get: function () { return logger_factory_1.LoggerFactory; } });
Object.defineProperty(exports, "LoggerBuilder", { enumerable: true, get: function () { return logger_factory_1.LoggerBuilder; } });
Object.defineProperty(exports, "LoggerType", { enumerable: true, get: function () { return logger_factory_1.LoggerType; } });
Object.defineProperty(exports, "initGlobalLogger", { enumerable: true, get: function () { return logger_factory_1.initGlobalLogger; } });
Object.defineProperty(exports, "getGlobalLogger", { enumerable: true, get: function () { return logger_factory_1.getGlobalLogger; } });
// Configuration exports
var logger_config_1 = require("./config/logger.config");
Object.defineProperty(exports, "getLoggerConfig", { enumerable: true, get: function () { return logger_config_1.getLoggerConfig; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logger_config_1.LogLevel; } });
// Context management exports
var async_context_1 = require("./context/async-context");
Object.defineProperty(exports, "contextManager", { enumerable: true, get: function () { return async_context_1.contextManager; } });
// Middleware exports
var express_middleware_1 = require("./middleware/express-middleware");
Object.defineProperty(exports, "tracingMiddleware", { enumerable: true, get: function () { return express_middleware_1.tracingMiddleware; } });
Object.defineProperty(exports, "errorLoggingMiddleware", { enumerable: true, get: function () { return express_middleware_1.errorLoggingMiddleware; } });
Object.defineProperty(exports, "bodyLoggingMiddleware", { enumerable: true, get: function () { return express_middleware_1.bodyLoggingMiddleware; } });
Object.defineProperty(exports, "performanceMetricsMiddleware", { enumerable: true, get: function () { return express_middleware_1.performanceMetricsMiddleware; } });
Object.defineProperty(exports, "userContextMiddleware", { enumerable: true, get: function () { return express_middleware_1.userContextMiddleware; } });
Object.defineProperty(exports, "addMetadata", { enumerable: true, get: function () { return express_middleware_1.addMetadata; } });
Object.defineProperty(exports, "sanitizeData", { enumerable: true, get: function () { return express_middleware_1.sanitizeData; } });
var next_middleware_1 = require("./middleware/next-middleware");
Object.defineProperty(exports, "withNextApiLogger", { enumerable: true, get: function () { return next_middleware_1.withNextApiLogger; } });
Object.defineProperty(exports, "withNextRouteLogger", { enumerable: true, get: function () { return next_middleware_1.withNextRouteLogger; } });
Object.defineProperty(exports, "createNextFetchWrapper", { enumerable: true, get: function () { return next_middleware_1.createNextFetchWrapper; } });
var nest_logger_middleware_1 = require("./middleware/nest-logger.middleware");
Object.defineProperty(exports, "NestLoggerMiddleware", { enumerable: true, get: function () { return nest_logger_middleware_1.NestLoggerMiddleware; } });
Object.defineProperty(exports, "createNestLoggingMiddleware", { enumerable: true, get: function () { return nest_logger_middleware_1.createNestLoggingMiddleware; } });
Object.defineProperty(exports, "createNestExceptionFilter", { enumerable: true, get: function () { return nest_logger_middleware_1.createNestExceptionFilter; } });
// Utility exports
var logger_utils_1 = require("./utils/logger-utils");
Object.defineProperty(exports, "createTimer", { enumerable: true, get: function () { return logger_utils_1.createTimer; } });
Object.defineProperty(exports, "withErrorLogging", { enumerable: true, get: function () { return logger_utils_1.withErrorLogging; } });
Object.defineProperty(exports, "withErrorLoggingSync", { enumerable: true, get: function () { return logger_utils_1.withErrorLoggingSync; } });
Object.defineProperty(exports, "logFunctionCall", { enumerable: true, get: function () { return logger_utils_1.logFunctionCall; } });
Object.defineProperty(exports, "LoggableError", { enumerable: true, get: function () { return logger_utils_1.LoggableError; } });
Object.defineProperty(exports, "BatchLogger", { enumerable: true, get: function () { return logger_utils_1.BatchLogger; } });
Object.defineProperty(exports, "auditLog", { enumerable: true, get: function () { return logger_utils_1.auditLog; } });
Object.defineProperty(exports, "withLoggingContext", { enumerable: true, get: function () { return logger_utils_1.withLoggingContext; } });
// Console capture exports
var console_capture_1 = require("./utils/console-capture");
Object.defineProperty(exports, "captureConsole", { enumerable: true, get: function () { return console_capture_1.captureConsole; } });
Object.defineProperty(exports, "restoreConsole", { enumerable: true, get: function () { return console_capture_1.restoreConsole; } });
// Error handling exports
var error_handler_1 = require("./utils/error-handler");
Object.defineProperty(exports, "retryWithBackoff", { enumerable: true, get: function () { return error_handler_1.retryWithBackoff; } });
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return error_handler_1.CircuitBreaker; } });
Object.defineProperty(exports, "safeAsync", { enumerable: true, get: function () { return error_handler_1.safeAsync; } });
Object.defineProperty(exports, "withGracefulDegradation", { enumerable: true, get: function () { return error_handler_1.withGracefulDegradation; } });
// Metrics exports
var metrics_1 = require("./utils/metrics");
Object.defineProperty(exports, "Gauge", { enumerable: true, get: function () { return metrics_1.Gauge; } });
Object.defineProperty(exports, "Counter", { enumerable: true, get: function () { return metrics_1.Counter; } });
Object.defineProperty(exports, "Histogram", { enumerable: true, get: function () { return metrics_1.Histogram; } });
Object.defineProperty(exports, "MetricsRegistry", { enumerable: true, get: function () { return metrics_1.MetricsRegistry; } });
Object.defineProperty(exports, "getMetricsRegistry", { enumerable: true, get: function () { return metrics_1.getMetricsRegistry; } });
Object.defineProperty(exports, "loggerMetrics", { enumerable: true, get: function () { return metrics_1.loggerMetrics; } });
// Configuration validation exports
var config_validator_1 = require("./config/config-validator");
Object.defineProperty(exports, "validateLoggerConfig", { enumerable: true, get: function () { return config_validator_1.validateLoggerConfig; } });
Object.defineProperty(exports, "assertValidConfig", { enumerable: true, get: function () { return config_validator_1.assertValidConfig; } });
Object.defineProperty(exports, "parseFileSize", { enumerable: true, get: function () { return config_validator_1.parseFileSize; } });
Object.defineProperty(exports, "ConfigValidationError", { enumerable: true, get: function () { return config_validator_1.ConfigValidationError; } });
// Health check exports
var health_check_1 = require("./utils/health-check");
Object.defineProperty(exports, "performHealthCheck", { enumerable: true, get: function () { return health_check_1.performHealthCheck; } });
Object.defineProperty(exports, "healthCheckMiddleware", { enumerable: true, get: function () { return health_check_1.healthCheckMiddleware; } });
Object.defineProperty(exports, "getHealthStatusMessage", { enumerable: true, get: function () { return health_check_1.getHealthStatusMessage; } });
Object.defineProperty(exports, "HealthStatus", { enumerable: true, get: function () { return health_check_1.HealthStatus; } });
