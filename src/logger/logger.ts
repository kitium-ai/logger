import * as winston from 'winston';
import LokiTransport from 'winston-loki';

import type { LoggerConfig } from '../config/logger.config';
import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';
import { applySchemaContract } from '../utils/log-schema';
import type { ILogger } from './logger.interface';

const TIMESTAMP_FORMAT = TIMESTAMP_FORMAT;

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    debug: 'gray',
  },
};

export class CentralLogger implements ILogger {
  private logger: winston.Logger;
  private readonly config: LoggerConfig;
  private lokiFailureCount = 0;
  private lokiCircuitOpen = false;

  constructor(config: LoggerConfig, existingLogger?: winston.Logger) {
    this.config = config;
    this.logger = existingLogger ?? this.createLogger();
  }

  /* eslint-disable max-lines-per-function */
  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    const samplingRate = this.normalizeSamplingRate(this.config.samplingRate);
    const samplingFilter = winston.format((info) => {
      if (samplingRate >= 1) return info;
      return Math.random() <= samplingRate ? info : false;
    });

    // Console transport
    if (this.config.enableConsoleTransport) {
      const timestampFormat = TIMESTAMP_FORMAT;
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            samplingFilter(),
            winston.format.timestamp({ format: timestampFormat }),
            winston.format.colorize(),
            this.enrichWithContext(),
            this.schemaValidator(),
            winston.format.printf(this.formatConsoleLog.bind(this))
          ),
        })
      );
    }

    // File transport (optional)
    if (this.config.enableFileTransport) {
      transports.push(
        new winston.transports.File({
          filename: `${this.config.fileLogPath}/error.log`,
          level: 'error',
          maxsize: this.parseFileSize(this.config.maxFileSize),
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            samplingFilter(),
            winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
            winston.format.errors({ stack: true }),
            this.enrichWithContext(),
            this.schemaValidator(),
            winston.format.json()
          ),
        })
      );

      transports.push(
        new winston.transports.File({
          filename: `${this.config.fileLogPath}/combined.log`,
          maxsize: this.parseFileSize(this.config.maxFileSize),
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            samplingFilter(),
            winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
            winston.format.errors({ stack: true }),
            this.enrichWithContext(),
            this.schemaValidator(),
            winston.format.json()
          ),
        })
      );
    }

    // Loki transport
    if (this.config.loki.enabled) {
      transports.push(
        new LokiTransport({
          host: `${this.config.loki.protocol}://${this.config.loki.host}`,
          port: this.config.loki.port,
          labels: this.config.loki.labels,
          json: true,
          batching: true,
          batchSize: this.config.loki.batchSize,
          interval: this.config.loki.interval,
          timeout: this.config.loki.timeout,
          ...(this.config.loki.basicAuth && {
            basicAuth: `${this.config.loki.basicAuth.username}:${this.config.loki.basicAuth.password}`,
          }),
          format: winston.format.combine(
            samplingFilter(),
            winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
            winston.format.errors({ stack: true }),
            this.enrichWithContext(),
            this.schemaValidator(),
            winston.format.json()
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      );

      const lokiTransport = transports[transports.length - 1] as LokiTransport;
      this.registerLokiHealth(lokiTransport);
    }

    return winston.createLogger({
      levels: customLevels.levels,
      level: this.config.logLevel,
      defaultMeta: {
        service: this.config.serviceName,
        environment: this.config.environment,
        pid: process.pid,
        hostname: require('node:os').hostname(),
      },
      transports,
      exceptionHandlers: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });
  }

  private enrichWithContext() {
    return winston.format((info) => {
      const context = contextManager.getContext();
      info['traceId'] = context.traceId;
      if (context.spanId) info['spanId'] = context.spanId;
      if (context.userId) info['userId'] = context.userId;
      if (context.requestId) info['requestId'] = context.requestId;
      if (context.sessionId) info['sessionId'] = context.sessionId;
      if (context.correlationId) info['correlationId'] = context.correlationId;
      if (context.metadata && Object.keys(context.metadata).length > 0) {
        info['metadata'] = context.metadata;
      }
      return info;
    })();
  }

  private schemaValidator() {
    if (this.config.enforceSchema === false) {
      return winston.format((info) => info)();
    }
    return applySchemaContract(this.config);
  }

  private normalizeSamplingRate(rate: number | undefined): number {
    if (rate === undefined || Number.isNaN(rate)) return 1;
    if (rate < 0) return 0;
    if (rate > 1) return 1;
    return rate;
  }

  private registerLokiHealth(transport: LokiTransport): void {
    const threshold = this.config.loki.circuitBreaker?.failureThreshold ?? 5;
    const resetTimeout = this.config.loki.circuitBreaker?.resetTimeoutMs ?? 60000;

    transport.on('error', (error: Error) => {
      this.lokiFailureCount += 1;
      this.logger.warn('Loki transport error detected', {
        error: error.message,
        lokiFailureCount: this.lokiFailureCount,
      });

      if (this.lokiFailureCount >= threshold && !this.lokiCircuitOpen) {
        this.lokiCircuitOpen = true;
        transport.silent = true;
        this.logger.error('Loki circuit opened, routing logs to fallback transport', {
          threshold,
          resetTimeout,
        });
        this.routeFallback(error);
        setTimeout(() => {
          this.lokiFailureCount = 0;
          this.lokiCircuitOpen = false;
          transport.silent = false;
          this.logger.info('Loki circuit closed, resuming transport');
        }, resetTimeout);
      }
    });
  }

  private routeFallback(error: Error): void {
    const fallback = this.config.loki.circuitBreaker?.fallbackTransport ?? 'console';
    const meta = {
      fallback,
      error: error.message,
    };

    if (fallback === 'none') {
      this.logger.warn('Dropping logs because Loki is unavailable and fallback is disabled', meta);
      return;
    }

    if (fallback === 'file' && !this.config.enableFileTransport) {
      this.logger.warn(
        'File fallback requested but file transport is disabled; using console instead',
        meta
      );
    }

    this.logger.warn('Routing Loki logs to fallback transport', meta);
  }

  private formatConsoleLog(info: winston.Logform.TransformableInfo): string {
    const context = contextManager.getContext();
    const timestamp = this.config.includeTimestamp ? `${info['timestamp']} ` : '';
    const level = `[${info.level.toUpperCase()}]`;
    const service = `[${this.config.serviceName}]`;
    const trace = context.traceId ? ` [${context.traceId.substring(0, 8)}]` : '';

    let message = `${timestamp}${level} ${service}${trace} ${info.message}`;

    if (info['error'] && info['error'] instanceof Error) {
      message += `\n  Error: ${info['error'].message}`;
      if (info['stack']) {
        message += `\n${info['stack']}`;
      }
    }

    if (this.config.includeMeta && info['meta'] && Object.keys(info['meta']).length > 0) {
      message += `\n  Meta: ${JSON.stringify(info['meta'], null, 2)}`;
    }

    return message;
  }

  private parseFileSize(sizeString: string): number {
    const units: Record<string, number> = { k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
    const match = sizeString.toLowerCase().match(/^(\d+)([kmg])?b?$/);
    if (!match?.[1]) return 100 * 1024 * 1024; // Default 100MB
    const value = parseInt(match[1], 10);
    const unit = match[2] ?? 'b';
    // eslint-disable-next-line security/detect-object-injection
    return value * (units[unit] ?? 1);
  }

  error(message: string, meta?: unknown, error?: Error): void {
    const errorInfo: Record<string, unknown> = { message };
    if (error) {
      errorInfo['error'] = error;
      errorInfo['stack'] = error.stack;
    }
    if (meta) {
      errorInfo['meta'] = meta;
    }
    this.logger.error(errorInfo);
  }

  warn(message: string, meta?: unknown): void {
    this.logger.warn({ message, meta });
  }

  info(message: string, meta?: unknown): void {
    this.logger.info({ message, meta });
  }

  http(message: string, meta?: unknown): void {
    this.logger.log('http', { message, meta });
  }

  debug(message: string, meta?: unknown): void {
    this.logger.debug({ message, meta });
  }

  /**
   * Log with context initialization
   */
  withContext<T>(context: Partial<LogContext>, function_: () => T | Promise<T>): T | Promise<T> {
    const fullContext = contextManager.initContext(context);
    return contextManager.run(fullContext, () => function_());
  }

  /**
   * Create child logger with additional metadata
   */
  child(metadata: Record<string, unknown>): ILogger {
    const winstonChild = this.logger.child(metadata);
    return new CentralLogger(this.config, winstonChild);
  }

  /**
   * Close logger and flush buffers (important for Loki)
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      // If logger is already closed, resolve immediately
      if (!this.logger || (this.logger as unknown as { closed?: boolean }).closed) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        resolve();
      }, 1000);

      this.logger.once('finish', () => {
        clearTimeout(timeout);
        resolve();
      });

      try {
        this.logger.end();
      } catch {
        clearTimeout(timeout);
        resolve();
      }
    });
  }
}

let globalLogger: ILogger | undefined;

export function initializeLogger(config: LoggerConfig): ILogger {
  globalLogger = new CentralLogger(config);
  return globalLogger;
}

export function getLogger(): ILogger {
  if (!globalLogger) {
    throw new Error('Logger not initialized. Call initializeLogger first.');
  }
  return globalLogger;
}

export default globalLogger as ILogger;
