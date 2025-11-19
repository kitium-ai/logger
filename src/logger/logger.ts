import * as winston from 'winston';
import LokiTransport from 'winston-loki';
import type { ILogger } from './logger.interface';
import type { LoggerConfig } from '../config/logger.config';
import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';

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

  constructor(config: LoggerConfig) {
    this.config = config;
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.enableConsoleTransport) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(this.formatConsoleLog.bind(this)),
          ),
        }),
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
          format: winston.format.json(),
        }),
      );

      transports.push(
        new winston.transports.File({
          filename: `${this.config.fileLogPath}/combined.log`,
          maxsize: this.parseFileSize(this.config.maxFileSize),
          maxFiles: this.config.maxFiles,
          format: winston.format.json(),
        }),
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
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            this.enrichWithContext(),
            winston.format.json(),
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
      );
    }

    return winston.createLogger({
      levels: customLevels.levels,
      level: this.config.logLevel,
      defaultMeta: {
        service: this.config.serviceName,
        environment: this.config.environment,
        pid: process.pid,
        hostname: require('os').hostname(),
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
      info.traceId = context.traceId;
      if (context.spanId) info.spanId = context.spanId;
      if (context.userId) info.userId = context.userId;
      if (context.requestId) info.requestId = context.requestId;
      if (context.sessionId) info.sessionId = context.sessionId;
      if (context.correlationId) info.correlationId = context.correlationId;
      if (context.metadata && Object.keys(context.metadata).length > 0) {
        info.metadata = context.metadata;
      }
      return info;
    })();
  }

  private formatConsoleLog(info: winston.Logform.TransformableInfo): string {
    const context = contextManager.getContext();
    const timestamp = this.config.includeTimestamp ? `${info.timestamp} ` : '';
    const level = `[${info.level.toUpperCase()}]`;
    const service = `[${this.config.serviceName}]`;
    const trace = context.traceId ? ` [${context.traceId.substring(0, 8)}]` : '';

    let message = `${timestamp}${level} ${service}${trace} ${info.message}`;

    if (info.error && info.error instanceof Error) {
      message += `\n  Error: ${info.error.message}`;
      if (info.stack) {
        message += `\n${info.stack}`;
      }
    }

    if (this.config.includeMeta && info.meta && Object.keys(info.meta).length > 0) {
      message += `\n  Meta: ${JSON.stringify(info.meta, null, 2)}`;
    }

    return message;
  }

  private parseFileSize(sizeStr: string): number {
    const units: Record<string, number> = { k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+)([kmg])?b?$/);
    if (!match) return 100 * 1024 * 1024; // Default 100MB
    const value = parseInt(match[1], 10);
    const unit = match[2] ?? 'b';
    return value * (units[unit] ?? 1);
  }

  error(message: string, meta?: unknown, error?: Error): void {
    const errorInfo: Record<string, unknown> = { message };
    if (error) {
      errorInfo.error = error;
      errorInfo.stack = error.stack;
    }
    if (meta) {
      errorInfo.meta = meta;
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
  withContext<T>(context: Partial<LogContext>, fn: () => T | Promise<T>): T | Promise<T> {
    const fullContext = contextManager.initContext(context);
    return contextManager.run(fullContext, () => fn());
  }

  /**
   * Create child logger with additional metadata
   */
  child(metadata: Record<string, unknown>): ILogger {
    const childLogger = new CentralLogger(this.config);
    childLogger.logger = this.logger.child(metadata);
    return childLogger;
  }

  /**
   * Close logger and flush buffers (important for Loki)
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
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
