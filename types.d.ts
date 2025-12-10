/**
 * @kitiumai/logger TypeScript declarations for module augmentation and subpath support
 */

declare module '@kitiumai/logger' {
  export function createLogger(presetOrConfig?: any, overrides?: Record<string, any>): any;
  export function getLogger(): any;
  export function initializeLogger(config: any): any;
  export function getGlobalLogger(): any;
  export function initGlobalLogger(config: any): void;

  export const CentralLogger: any;
  export const ConsoleLogger: any;
  export const FileLogger: any;
  export const InMemoryLogger: any;
  export const LoggerFactory: any;
  export const LoggerBuilder: any;
  export const LoggerType: any;

  export const LogLevel: {
    ERROR: 'error';
    WARN: 'warn';
    INFO: 'info';
    HTTP: 'http';
    DEBUG: 'debug';
  };

  export const contextManager: any;
  export const loggerMetrics: any;
  export const getMetricsRegistry: () => any;

  export type ILogger = any;
  export type LogEntry = any;
  export type LoggerConfig = any;
  export type LoggerPreset = any;
  export type LokiConfig = any;
  export type LogContext = any;
}

declare module '@kitiumai/logger/middleware' {
  export function tracingMiddleware(logger: any): any;
  export function errorLoggingMiddleware(logger: any): any;
  export function performanceMetricsMiddleware(logger: any): any;
  export function userContextMiddleware(logger: any): any;
  export function bodyLoggingMiddleware(logger: any): any;
  export function addMetadata(metadata: any): any;
  export function sanitizeData(data: any): any;
}

declare module '@kitiumai/logger/middleware/next' {
  export function withNextApiLogger(handler: any, logger?: any): any;
  export function withNextRouteLogger(handler: any, logger?: any): any;
  export function createNextFetchWrapper(logger: any): any;
}

declare module '@kitiumai/logger/middleware/nest' {
  export function createNestLoggingMiddleware(logger: any): any;
  export function createNestExceptionFilter(logger: any): any;
  export const NestLoggerMiddleware: any;
}

declare module '@kitiumai/logger/utils' {
  export function createTimer(label: string): any;
  export function logFunctionCall(target: any, propertyKey: string, descriptor: any): any;
  export function withErrorLogging(
    fn: (...args: any[]) => Promise<any>,
    logger?: any
  ): (...args: any[]) => Promise<any>;
  export function withErrorLoggingSync(
    fn: (...args: any[]) => any,
    logger?: any
  ): (...args: any[]) => any;
  export function withLoggingContext(
    fn: (...args: any[]) => Promise<any>,
    context?: any
  ): (...args: any[]) => Promise<any>;
  export function auditLog(action: string, actor: string, resource: any, details?: any): void;
  export const BatchLogger: any;
  export const LoggableError: any;

  export type StructuredLogEntry = any;
}

declare module '@kitiumai/logger/utils/console-capture' {
  export function captureConsole(options?: any): any;
  export function restoreConsole(): void;

  export type ConsoleCapture = any;
  export type ConsoleCaptureEntry = any;
  export type ConsoleCaptureOptions = any;
}

declare module '@kitiumai/logger/utils/metrics' {
  export function getMetricsRegistry(): any;
  export const Counter: any;
  export const Gauge: any;
  export const Histogram: any;

  export type MetricLabels = Record<string, string | number>;
  export type MetricValue = number;
}

declare module '@kitiumai/logger/utils/error-handler' {
  export function retryWithBackoff(fn: () => Promise<any>, config: any): Promise<any>;
  export function safeAsync(fn: () => Promise<any>, fallback?: any): Promise<any>;
  export function withGracefulDegradation(fn: () => Promise<any>, fallback?: any): Promise<any>;
  export const CircuitBreaker: any;

  export type RetryConfig = any;
}
