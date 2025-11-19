import type { ILogger } from './logger.interface';
import { CentralLogger } from './logger';
import { InMemoryLogger } from './in-memory-logger';
import { ConsoleLogger } from './console-logger';
import { FileLogger } from './file-logger';
import type { LoggerConfig } from '../config/logger.config';

/**
 * Logger type enumeration
 */
export enum LoggerType {
  CENTRAL = 'central', // Loki + Winston (default)
  IN_MEMORY = 'in-memory', // In-memory storage
  CONSOLE = 'console', // Console only
  FILE = 'file', // File-based logging
}

/**
 * Logger factory options
 */
export type LoggerFactoryOptions = {
  type: LoggerType;
  serviceName?: string;
  logPath?: string;
  maxSize?: string;
  maxFiles?: number | string;
  maxInMemoryLogs?: number;
  includeConsole?: boolean;
  includeTimestamp?: boolean;
  colors?: boolean;
};

/**
 * Factory for creating different logger types
 */
export class LoggerFactory {
  /**
   * Create a logger based on type
   */
  static create(options: LoggerFactoryOptions): ILogger {
    const serviceName = options.serviceName ?? 'app';

    switch (options.type) {
      case LoggerType.IN_MEMORY:
        return new InMemoryLogger({
          maxSize: options.maxInMemoryLogs ?? 10000,
          serviceName,
        });

      case LoggerType.CONSOLE:
        return new ConsoleLogger({
          serviceName,
          includeTimestamp: options.includeTimestamp !== false,
          colors: options.colors !== false,
        });

      case LoggerType.FILE:
        return new FileLogger({
          logPath: options.logPath ?? './logs',
          maxSize: options.maxSize ?? '100m',
          maxFiles: options.maxFiles ?? '14d',
          serviceName,
          includeConsole: options.includeConsole,
        });

      case LoggerType.CENTRAL:
      default:
        // For Central logger, we need the full config
        // This is handled by the LoggerBuilder
        throw new Error(
          'Central logger requires full config. Use LoggerBuilder.createCentralLogger()',
        );
    }
  }

  /**
   * Create a logger from type string
   */
  static createFromString(type: string, options: LoggerFactoryOptions): ILogger {
    const loggerType = (Object.values(LoggerType) as string[]).includes(type.toLowerCase())
      ? (type.toLowerCase() as LoggerType)
      : LoggerType.CENTRAL;

    return this.create({ ...options, type: loggerType });
  }
}

/**
 * Builder pattern for creating loggers with fluent API
 */
export class LoggerBuilder {
  private type: LoggerType = LoggerType.CENTRAL;
  private serviceName = 'app';
  private logPath = './logs';
  private maxSize = '100m';
  private maxFiles: number | string = 14;
  private maxInMemoryLogs = 10000;
  private includeConsole = true;
  private includeTimestamp = true;
  private colors = true;
  private config?: LoggerConfig;

  /**
   * Set logger type
   */
  withType(type: LoggerType): this {
    this.type = type;
    return this;
  }

  /**
   * Set service name
   */
  withServiceName(serviceName: string): this {
    this.serviceName = serviceName;
    return this;
  }

  /**
   * Set log file path
   */
  withLogPath(path: string): this {
    this.logPath = path;
    return this;
  }

  /**
   * Set max file size
   */
  withMaxFileSize(size: string): this {
    this.maxSize = size;
    return this;
  }

  /**
   * Set max number of files
   */
  withMaxFiles(count: number | string): this {
    this.maxFiles = count;
    return this;
  }

  /**
   * Set max in-memory logs
   */
  withMaxInMemoryLogs(count: number): this {
    this.maxInMemoryLogs = count;
    return this;
  }

  /**
   * Enable/disable console output
   */
  withConsole(enabled: boolean): this {
    this.includeConsole = enabled;
    return this;
  }

  /**
   * Enable/disable timestamps
   */
  withTimestamps(enabled: boolean): this {
    this.includeTimestamp = enabled;
    return this;
  }

  /**
   * Enable/disable colored output
   */
  withColors(enabled: boolean): this {
    this.colors = enabled;
    return this;
  }

  /**
   * Set full config (for central logger)
   */
  withConfig(config: LoggerConfig): this {
    this.config = config;
    return this;
  }

  /**
   * Build the logger
   */
  build(): ILogger {
    if (this.type === LoggerType.CENTRAL) {
      if (!this.config) {
        throw new Error('Central logger requires config. Use .withConfig()');
      }
      return new CentralLogger(this.config);
    }

    return LoggerFactory.create({
      type: this.type,
      serviceName: this.serviceName,
      logPath: this.logPath,
      maxSize: this.maxSize,
      maxFiles: this.maxFiles,
      maxInMemoryLogs: this.maxInMemoryLogs,
      includeConsole: this.includeConsole,
      includeTimestamp: this.includeTimestamp,
      colors: this.colors,
    });
  }

  /**
   * Build console logger (convenience method)
   */
  static console(serviceName = 'app'): ILogger {
    return new LoggerBuilder().withType(LoggerType.CONSOLE).withServiceName(serviceName).build();
  }

  /**
   * Build file logger (convenience method)
   */
  static file(serviceName = 'app', logPath = './logs'): ILogger {
    return new LoggerBuilder()
      .withType(LoggerType.FILE)
      .withServiceName(serviceName)
      .withLogPath(logPath)
      .build();
  }

  /**
   * Build in-memory logger (convenience method)
   */
  static inMemory(serviceName = 'app', maxLogs = 10000): ILogger {
    return new LoggerBuilder()
      .withType(LoggerType.IN_MEMORY)
      .withServiceName(serviceName)
      .withMaxInMemoryLogs(maxLogs)
      .build();
  }

  /**
   * Build central logger (convenience method)
   */
  static central(config: LoggerConfig): ILogger {
    return new LoggerBuilder().withType(LoggerType.CENTRAL).withConfig(config).build();
  }
}

/**
 * Global logger instance
 */
let globalLogger: ILogger | null = null;

/**
 * Initialize global logger with automatic type selection
 */
export function initGlobalLogger(
  options: LoggerFactoryOptions & { config?: LoggerConfig },
): ILogger {
  if (options.type === LoggerType.CENTRAL && !options.config) {
    throw new Error('Central logger requires config option');
  }

  if (options.type === LoggerType.CENTRAL && options.config) {
    globalLogger = new CentralLogger(options.config);
  } else {
    globalLogger = LoggerFactory.create(options as LoggerFactoryOptions);
  }

  return globalLogger;
}

/**
 * Get global logger instance
 */
export function getGlobalLogger(): ILogger {
  if (!globalLogger) {
    throw new Error(
      'Global logger not initialized. Call initGlobalLogger() or initializeLogger() first.',
    );
  }
  return globalLogger;
}
