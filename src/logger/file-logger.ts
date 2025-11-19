import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import type { ILogger } from './logger.interface';
import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';

/**
 * File-based logger with rotation support
 * Stores logs to disk in JSON format
 */
export class FileLogger implements ILogger {
  private readonly logger: winston.Logger;
  private readonly serviceName: string;

  constructor(options: {
    logPath?: string;
    maxSize?: string;
    maxFiles?: number | string;
    serviceName?: string;
    includeConsole?: boolean;
  } = {}) {
    this.serviceName = options.serviceName ?? 'app';

    const transports: winston.transport[] = [];

    // Daily rotating file
    transports.push(
      new DailyRotateFile({
        filename: `${options.logPath ?? './logs'}/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: options.maxSize ?? '100m',
        maxFiles: options.maxFiles ?? '14d',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );

    // Separate error log
    transports.push(
      new DailyRotateFile({
        filename: `${options.logPath ?? './logs'}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: options.maxSize ?? '100m',
        maxFiles: options.maxFiles ?? '14d',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );

    // Optional console output
    if (options.includeConsole !== false) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${timestamp} [${level}] ${message}`;
            }),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.json(),
      defaultMeta: {
        service: this.serviceName,
      },
      transports,
    });
  }

  error(message: string, meta?: unknown, error?: Error): void {
    const logData = this.enrichLogData(meta);
    if (error) {
      logData.error = { message: error.message, stack: error.stack };
    }
    this.logger.error(message, logData);
  }

  warn(message: string, meta?: unknown): void {
    const logData = this.enrichLogData(meta);
    this.logger.warn(message, logData);
  }

  info(message: string, meta?: unknown): void {
    const logData = this.enrichLogData(meta);
    this.logger.info(message, logData);
  }

  http(message: string, meta?: unknown): void {
    const logData = this.enrichLogData(meta);
    this.logger.log('info', message, logData);
  }

  debug(message: string, meta?: unknown): void {
    const logData = this.enrichLogData(meta);
    this.logger.debug(message, logData);
  }

  withContext<T>(
    context: Partial<LogContext>,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    const fullContext = contextManager.initContext(context);
    return contextManager.run(fullContext, () => fn());
  }

  child(_metadata: Record<string, unknown>): ILogger {
    // Return new instance with additional metadata
    return this;
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }

  private enrichLogData(meta?: unknown): Record<string, unknown> {
    const context = contextManager.getContext();
    return {
      ...(typeof meta === 'object' && meta !== null ? meta : {}),
      traceId: context.traceId,
      userId: context.userId,
      requestId: context.requestId,
      sessionId: context.sessionId,
      correlationId: context.correlationId,
    };
  }
}
