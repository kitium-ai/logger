import * as winston from 'winston';
import LokiTransport from 'winston-loki';

import type { LoggerConfig } from '../config/logger.config';
import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';
import { applySchemaContract } from '../utils/log-schema';
import type { ILogger } from './logger.interface';
import { AsyncLoggingQueue, type LogEntry, type AsyncQueueConfig } from '../utils/async-logging-queue';
import { TransportHealthMonitor, type HealthMonitorConfig } from '../utils/transport-health-monitor';
import { EnhancedSecurityManager, type SecurityConfig } from '../utils/enhanced-security';
import { MetricsCollector, type MetricsConfig } from '../utils/metrics-collector';

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';

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
  private asyncQueue: AsyncLoggingQueue;
  private healthMonitor: TransportHealthMonitor;
  private securityManager: EnhancedSecurityManager;
  private metricsCollector: MetricsCollector;

  constructor(config: LoggerConfig, existingLogger?: winston.Logger) {
    this.config = config;
    this.logger = existingLogger ?? this.createLogger();

    // Initialize async logging queue
    const queueConfig: AsyncQueueConfig = {
      maxQueueSize: parseInt(process.env['LOG_QUEUE_SIZE'] ?? '10000'),
      flushInterval: parseInt(process.env['LOG_FLUSH_INTERVAL'] ?? '5000'),
      maxRetries: parseInt(process.env['LOG_MAX_RETRIES'] ?? '3'),
      retryDelay: parseInt(process.env['LOG_RETRY_DELAY'] ?? '1000'),
      enablePersistence: process.env['LOG_ENABLE_PERSISTENCE'] === 'true',
      persistencePath: process.env['LOG_PERSISTENCE_PATH'] ?? './logs/queue',
      enableGuaranteedDelivery: process.env['LOG_ENABLE_GUARANTEED_DELIVERY'] !== 'false',
      deadLetterQueuePath: process.env['LOG_DEAD_LETTER_PATH'] ?? './logs/dead-letter',
      maxDeadLetterSize: parseInt(process.env['LOG_MAX_DEAD_LETTER_SIZE'] ?? '1000'),
      retryBackoffMultiplier: parseFloat(process.env['LOG_RETRY_BACKOFF_MULTIPLIER'] ?? '2'),
      maxRetryDelay: parseInt(process.env['LOG_MAX_RETRY_DELAY'] ?? '30000'),
    };

    this.asyncQueue = new AsyncLoggingQueue(queueConfig, this.processLogBatch.bind(this));

    // Initialize transport health monitor
    const healthConfig: HealthMonitorConfig = {
      healthCheckInterval: parseInt(process.env['LOG_HEALTH_CHECK_INTERVAL'] ?? '30000'),
      failureThreshold: parseInt(process.env['LOG_FAILURE_THRESHOLD'] ?? '5'),
      recoveryThreshold: parseInt(process.env['LOG_RECOVERY_THRESHOLD'] ?? '2'),
      circuitBreakerTimeout: parseInt(process.env['LOG_CIRCUIT_BREAKER_TIMEOUT'] ?? '60000'),
      enableAutoFailover: process.env['LOG_ENABLE_AUTO_FAILOVER'] !== 'false',
    };

    this.healthMonitor = new TransportHealthMonitor(healthConfig);
    this.setupTransportHealthMonitoring();

    // Initialize enhanced security manager
    const securityConfig: SecurityConfig = {
      enablePIIDetection: process.env['LOG_ENABLE_PII_DETECTION'] !== 'false',
      enableEncryption: process.env['LOG_ENABLE_ENCRYPTION'] === 'true',
      enableAuditSigning: process.env['LOG_ENABLE_AUDIT_SIGNING'] === 'true',
      piiFields: (process.env['LOG_PII_FIELDS'] ?? 'password,token,secret,email,phone,ssn').split(','),
      ...(process.env['LOG_ENCRYPTION_KEY'] && { encryptionKey: process.env['LOG_ENCRYPTION_KEY'] }),
      ...(process.env['LOG_AUDIT_KEY'] && { auditKey: process.env['LOG_AUDIT_KEY'] }),
    };

    this.securityManager = new EnhancedSecurityManager(securityConfig);

    // Initialize metrics collector
    const metricsConfig: MetricsConfig = {
      enableMetrics: process.env['LOG_ENABLE_METRICS'] !== 'false',
      metricsInterval: parseInt(process.env['LOG_METRICS_INTERVAL'] ?? '10000'),
      retentionPeriod: parseInt(process.env['LOG_METRICS_RETENTION'] ?? '3600000'), // 1 hour
      alertThresholds: {
        errorRate: parseFloat(process.env['LOG_ALERT_ERROR_RATE'] ?? '5'),
        throughputDrop: parseFloat(process.env['LOG_ALERT_THROUGHPUT_DROP'] ?? '20'),
        queueSize: parseInt(process.env['LOG_ALERT_QUEUE_SIZE'] ?? '5000'),
        deadLetterGrowth: parseInt(process.env['LOG_ALERT_DEAD_LETTER_GROWTH'] ?? '10'),
      },
    };

    this.metricsCollector = new MetricsCollector(metricsConfig, () => this.asyncQueue.getStats());
  }

  /**
   * Setup transport health monitoring endpoints
   */
  private setupTransportHealthMonitoring(): void {
    // Register console transport (always healthy)
    this.healthMonitor.registerTransport({
      name: 'console',
      url: 'console://stdout',
      healthCheck: async () => true,
      send: async (data) => {
        // Console transport is handled by Winston
        this.logger.info('Health check data', data as any);
      },
    }, true); // Primary transport

    // Register file transport if enabled
    if (this.config.enableFileTransport) {
      this.healthMonitor.registerTransport({
        name: 'file',
        url: `file://${this.config.fileLogPath}`,
        healthCheck: async () => {
          // Check if we can write to the log directory
          const fs = await import('fs/promises');
          try {
            await fs.access(this.config.fileLogPath);
            return true;
          } catch {
            return false;
          }
        },
        send: async (data) => {
          // File transport is handled by Winston
          this.logger.info('File transport data', data as any);
        },
      });
    }

    // Register Loki transport if enabled
    if (this.config.loki.enabled) {
      this.healthMonitor.registerTransport({
        name: 'loki',
        url: `${this.config.loki.protocol}://${this.config.loki.host}:${this.config.loki.port}`,
        healthCheck: async () => {
          try {
            const axios = (await import('axios')).default;
            const response = await axios.get(`${this.config.loki.protocol}://${this.config.loki.host}:${this.config.loki.port}/ready`, {
              timeout: 5000,
            });
            return response.status === 200;
          } catch {
            return false;
          }
        },
        send: async (data) => {
          // Loki transport is handled by Winston
          this.logger.info('Loki transport data', data as any);
        },
      });
    }
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
    const logEntry: LogEntry = {
      level: 'error',
      message,
      ...(meta !== undefined && { meta }),
      ...(error && { error }),
      timestamp: Date.now(),
      contextId: contextManager.getContext().traceId,
    };
    const securedEntry = this.secureLogEntry(logEntry);
    this.asyncQueue.enqueue(securedEntry);
  }

  warn(message: string, meta?: unknown): void {
    const logEntry: LogEntry = {
      level: 'warn',
      message,
      ...(meta !== undefined && { meta }),
      timestamp: Date.now(),
      contextId: contextManager.getContext().traceId,
    };
    const securedEntry = this.secureLogEntry(logEntry);
    this.asyncQueue.enqueue(securedEntry);
  }

  info(message: string, meta?: unknown): void {
    const logEntry: LogEntry = {
      level: 'info',
      message,
      ...(meta !== undefined && { meta }),
      timestamp: Date.now(),
      contextId: contextManager.getContext().traceId,
    };
    const securedEntry = this.secureLogEntry(logEntry);
    this.asyncQueue.enqueue(securedEntry);
  }

  http(message: string, meta?: unknown): void {
    const logEntry: LogEntry = {
      level: 'http',
      message,
      ...(meta !== undefined && { meta }),
      timestamp: Date.now(),
      contextId: contextManager.getContext().traceId,
    };
    const securedEntry = this.secureLogEntry(logEntry);
    this.asyncQueue.enqueue(securedEntry);
  }

  debug(message: string, meta?: unknown): void {
    const logEntry: LogEntry = {
      level: 'debug',
      message,
      ...(meta !== undefined && { meta }),
      timestamp: Date.now(),
      contextId: contextManager.getContext().traceId,
    };
    const securedEntry = this.secureLogEntry(logEntry);
    this.asyncQueue.enqueue(securedEntry);
  }

  /**
   * Apply security transformations to log entry
   */
  private secureLogEntry(entry: LogEntry): LogEntry {
    // Sanitize PII and sensitive data
    const sanitizedMessage = this.securityManager.sanitizeData(entry.message) as string;
    const sanitizedMeta = entry.meta ? this.securityManager.sanitizeData(entry.meta) : undefined;

    // Encrypt sensitive fields if enabled
    const encryptedMeta = sanitizedMeta ? this.encryptSensitiveFields(sanitizedMeta) : undefined;

    // Create audit trail if enabled
    const auditEntry = this.securityManager.createAuditEntry(
      entry.level,
      sanitizedMessage,
      (encryptedMeta as Record<string, unknown>) || {}
    );

    return {
      level: entry.level,
      message: sanitizedMessage,
      meta: auditEntry.metadata,
      ...(entry.error && { error: entry.error }),
      timestamp: entry.timestamp,
      ...(entry.contextId && { contextId: entry.contextId }),
      ...(auditEntry.signature && { auditSignature: auditEntry.signature }),
    };
  }

  /**
   * Encrypt sensitive fields in metadata
   */
  private encryptSensitiveFields(data: unknown): unknown {
    if (!this.securityManager['config'].enableEncryption || !this.securityManager['config'].encryptionKey) {
      return data;
    }

    const sensitiveFields = this.securityManager['config'].piiFields;
    return this.deepEncrypt(data, sensitiveFields);
  }

  /**
   * Recursively encrypt sensitive fields
   */
  private deepEncrypt(obj: unknown, sensitiveFields: string[]): unknown {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepEncrypt(item, sensitiveFields));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        // Encrypt sensitive field
        result[key] = this.securityManager['encryptData'](String(value));
      } else if (typeof value === 'object') {
        result[key] = this.deepEncrypt(value, sensitiveFields);
      } else {
        result[key] = value;
      }
    }
    return result;
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
   * Process a batch of log entries through Winston with health monitoring
   */
  private async processLogBatch(entries: LogEntry[]): Promise<void> {
    // Check if we have a healthy transport
    const activeTransport = this.healthMonitor.getActiveTransport();

    if (!activeTransport) {
      throw new Error('No healthy transport available for log processing');
    }

    // Process entries through Winston (which handles the actual transport)
    for (const entry of entries) {
      try {
        // Use Winston's log method with the appropriate level
        const metadata = typeof entry.meta === 'object' && entry.meta !== null ? entry.meta : {};
        (this.logger as any).log(entry.level, entry.message, {
          ...metadata,
          error: entry.error,
          timestamp: entry.timestamp,
          contextId: entry.contextId,
          auditSignature: entry.auditSignature,
        });
      } catch (error) {
        // If Winston fails, log to console as fallback and mark transport as unhealthy
        console.error('Failed to process log entry:', error, entry);
        this.healthMonitor.checkHealth(activeTransport);
        throw error;
      }
    }
  }

  /**
   * Get async queue statistics
   */
  getQueueStats() {
    return this.asyncQueue.getStats();
  }

  /**
   * Get transport health status
   */
  getTransportHealth() {
    return this.healthMonitor.getHealthStatus();
  }

  /**
   * Get dead letter queue contents
   */
  getDeadLetterQueue() {
    return this.asyncQueue.getDeadLetterQueue();
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    this.asyncQueue.clearDeadLetterQueue();
  }

  /**
   * Re-queue entries from dead letter queue
   */
  requeueFromDeadLetter(count: number = 1) {
    return this.asyncQueue.requeueFromDeadLetter(count);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    return this.metricsCollector.getMetricsSummary();
  }

  /**
   * Get metrics for a time range
   */
  getMetricsRange(startTime: number, endTime: number) {
    return this.metricsCollector.getMetricsRange(startTime, endTime);
  }

  /**
   * Export all metrics data
   */
  exportMetrics() {
    return this.metricsCollector.exportMetrics();
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    await this.asyncQueue.shutdown();
    this.healthMonitor.shutdown();
    this.metricsCollector.shutdown();
    this.logger.end();
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
