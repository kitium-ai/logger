/**
 * Console capture utilities with context propagation
 * Framework-agnostic console interception for testing and debugging
 */

import { contextManager, getLogger, sanitizeData } from '../index';
import type { LogContext } from '../context/async-context';

export interface ConsoleCaptureEntry {
  level: string;
  message: string[];
  timestamp: number;
  traceId?: string;
  spanId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsoleCapture {
  entries: ConsoleCaptureEntry[];
  logs: ConsoleCaptureEntry[];
  errors: ConsoleCaptureEntry[];
  warns: ConsoleCaptureEntry[];
  infos: ConsoleCaptureEntry[];
  debugs: ConsoleCaptureEntry[];
  clear(): void;
  getAll(): ConsoleCaptureEntry[];
  getByLevel(level: string): ConsoleCaptureEntry[];
  getByTraceId(traceId: string): ConsoleCaptureEntry[];
  hasOutput(level?: string): boolean;
  exportToLogger(): void;
}

export interface ConsoleCaptureOptions {
  /**
   * Whether to automatically send captured logs to @kitiumai/logger
   */
  autoLogToLogger?: boolean;
  /**
   * Whether to redact sensitive data
   */
  redactSensitive?: boolean;
  /**
   * Custom sensitive field names for redaction
   */
  sensitiveFields?: string[];
  /**
   * Custom context provider (defaults to contextManager.getContext())
   */
  getContext?: () => LogContext;
  /**
   * Custom logger instance (defaults to getLogger())
   */
  logger?: ReturnType<typeof getLogger>;
}

interface OriginalConsole {
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
  debug: typeof console.debug;
}

/**
 * Capture console output with context propagation and logger integration
 * Framework-agnostic implementation
 */
export function captureConsole(options: ConsoleCaptureOptions = {}): ConsoleCapture {
  const {
    autoLogToLogger = false,
    redactSensitive = true,
    sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'],
    getContext = () => contextManager.getContext(),
    logger = getLogger(),
  } = options;

  const entries: ConsoleCaptureEntry[] = [];

  const capture =
    (level: string) =>
    (...args: unknown[]): void => {
      const context = getContext();
      const timestamp = Date.now();

      // Redact sensitive data if enabled
      const sanitizedArguments = redactSensitive
        ? args.map((argument) => sanitizeData(argument, sensitiveFields))
        : args;

      const entry: ConsoleCaptureEntry = {
        level,
        message: sanitizedArguments.map((argument) => String(argument)),
        timestamp,
        traceId: context.traceId,
        ...(context.spanId !== undefined && { spanId: context.spanId }),
        ...(context.requestId !== undefined && { requestId: context.requestId }),
        ...(context.metadata !== undefined && { metadata: context.metadata }),
      };

      entries.push(entry);

      // Auto-log to logger if enabled
      if (autoLogToLogger) {
        const logMessage = sanitizedArguments.map((argument) => String(argument)).join(' ');
        const metadata = {
          ...context.metadata,
          consoleCapture: true,
          originalLevel: level,
        };

        switch (level) {
          case 'error':
            logger.error(logMessage, metadata);
            break;
          case 'warn':
            logger.warn(logMessage, metadata);
            break;
          case 'info':
            logger.info(logMessage, metadata);
            break;
          case 'debug':
            logger.debug(logMessage, metadata);
            break;
          default:
            logger.info(logMessage, metadata);
        }
      }
    };

  // Override console methods
  console.log = capture('log') as typeof console.log;
  console.info = capture('info') as typeof console.info;
  console.warn = capture('warn') as typeof console.warn;
  console.error = capture('error') as typeof console.error;
  console.debug = capture('debug') as typeof console.debug;

  return {
    get entries() {
      return [...entries];
    },
    get logs() {
      return entries.filter((o) => o.level === 'log');
    },
    get errors() {
      return entries.filter((o) => o.level === 'error');
    },
    get warns() {
      return entries.filter((o) => o.level === 'warn');
    },
    get infos() {
      return entries.filter((o) => o.level === 'info');
    },
    get debugs() {
      return entries.filter((o) => o.level === 'debug');
    },
    clear() {
      entries.length = 0;
    },
    getAll() {
      return [...entries];
    },
    getByLevel(level: string) {
      return entries.filter((o) => o.level === level);
    },
    getByTraceId(traceId: string) {
      return entries.filter((o) => o.traceId === traceId);
    },
    hasOutput(level?: string) {
      if (level) {
        return entries.some((o) => o.level === level);
      }
      return entries.length > 0;
    },
    exportToLogger() {
      const loggerInstance = logger || getLogger();
      for (const entry of entries) {
        const message = entry.message.join(' ');
        const metadata = {
          ...entry.metadata,
          consoleCapture: true,
          originalLevel: entry.level,
          traceId: entry.traceId,
          spanId: entry.spanId,
          requestId: entry.requestId,
        };

        switch (entry.level) {
          case 'error':
            loggerInstance.error(message, metadata);
            break;
          case 'warn':
            loggerInstance.warn(message, metadata);
            break;
          case 'info':
            loggerInstance.info(message, metadata);
            break;
          case 'debug':
            loggerInstance.debug(message, metadata);
            break;
          default:
            loggerInstance.info(message, metadata);
        }
      }
    },
  };
}

/**
 * Restore original console methods
 * Note: This is a helper - the capture function stores original methods internally
 */
export function restoreConsole(originalConsole: OriginalConsole): void {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
}
