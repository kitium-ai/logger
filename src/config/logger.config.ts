import * as dotenv from 'dotenv';

dotenv.config();

const DEFAULT_SERVICE_NAME = 'default-service';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

export type LokiConfig = {
  enabled: boolean;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  labels?: Record<string, string>;
  basicAuth?: {
    username: string;
    password: string;
  };
  batchSize: number;
  interval: number; // ms
  timeout: number; // ms
  circuitBreaker?: {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    fallbackTransport?: 'console' | 'file' | 'none';
  };
};

export type LoggerConfig = {
  serviceName: string;
  environment: 'development' | 'staging' | 'production';
  logLevel: LogLevel;
  loki: LokiConfig;
  enableConsoleTransport: boolean;
  enableFileTransport: boolean;
  fileLogPath: string;
  maxFileSize: string; // e.g., '100m'
  maxFiles: number;
  includeTimestamp: boolean;
  includeMeta: boolean;
  /**
   * Probability between 0 and 1 to keep the log. Used to control volume in production.
   */
  samplingRate?: number;
  /**
   * Enable schema validation and auto-filling of required fields.
   */
  enforceSchema?: boolean;
};

export type LoggerPreset = 'development' | 'staging' | 'production';

/* eslint-disable complexity */
export const getLoggerConfig = (): LoggerConfig => {
  const environment = (process.env['NODE_ENV'] ?? 'development') as LoggerPreset;

  const logLevel = (process.env['LOG_LEVEL'] ?? LogLevel.INFO) as LogLevel;

  const defaultService = DEFAULT_SERVICE_NAME;
  const lokiConfig: LokiConfig = {
    enabled: process.env['LOKI_ENABLED'] !== 'false',
    host: process.env['LOKI_HOST'] ?? 'localhost',
    port: parseInt(process.env['LOKI_PORT'] ?? '3100', 10),
    protocol: (process.env['LOKI_PROTOCOL'] ?? 'http') as 'http' | 'https',
    labels: {
      service: process.env['SERVICE_NAME'] ?? defaultService,
      environment,
      ...parseLokiLabels(process.env['LOKI_LABELS']),
    },
    ...(process.env['LOKI_USERNAME'] &&
      process.env['LOKI_PASSWORD'] && {
        basicAuth: {
          username: process.env['LOKI_USERNAME'],
          password: process.env['LOKI_PASSWORD'],
        },
      }),
    batchSize: parseInt(process.env['LOKI_BATCH_SIZE'] ?? '100', 10),
    interval: parseInt(process.env['LOKI_INTERVAL'] ?? '5000', 10),
    timeout: parseInt(process.env['LOKI_TIMEOUT'] ?? '10000', 10),
    circuitBreaker: {
      failureThreshold: parseInt(process.env['LOKI_FAILURE_THRESHOLD'] ?? '5', 10),
      resetTimeoutMs: parseInt(process.env['LOKI_RESET_TIMEOUT_MS'] ?? '60000', 10),
      fallbackTransport:
        (process.env['LOKI_FALLBACK'] as 'console' | 'file' | 'none' | undefined) ?? 'console',
    },
  };

  return {
    serviceName: process.env['SERVICE_NAME'] ?? DEFAULT_SERVICE_NAME,
    environment,
    logLevel,
    loki: lokiConfig,
    enableConsoleTransport: process.env['LOG_CONSOLE'] !== 'false',
    enableFileTransport: process.env['LOG_FILE_ENABLED'] === 'true',
    fileLogPath: process.env['LOG_FILE_PATH'] ?? './logs',
    maxFileSize: process.env['LOG_MAX_FILE_SIZE'] ?? '100m',
    maxFiles: parseInt(process.env['LOG_MAX_FILES'] ?? '14', 10),
    includeTimestamp: process.env['LOG_INCLUDE_TIMESTAMP'] !== 'false',
    includeMeta: process.env['LOG_INCLUDE_META'] !== 'false',
    samplingRate: parseFloat(process.env['LOG_SAMPLING_RATE'] ?? '1'),
    enforceSchema: process.env['LOG_ENFORCE_SCHEMA'] !== 'false',
  };
};

export function getPresetConfig(
  preset: LoggerPreset,
  overrides: Partial<LoggerConfig> = {}
): LoggerConfig {
  const base: LoggerConfig = {
    serviceName: process.env['SERVICE_NAME'] ?? DEFAULT_SERVICE_NAME,
    environment: preset,
    logLevel: preset === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    loki: {
      enabled: preset === 'production',
      host: process.env['LOKI_HOST'] ?? 'localhost',
      port: parseInt(process.env['LOKI_PORT'] ?? '3100', 10),
      protocol: (process.env['LOKI_PROTOCOL'] ?? 'http') as 'http' | 'https',
      labels: {
        service: process.env['SERVICE_NAME'] ?? DEFAULT_SERVICE_NAME,
        environment: preset,
      },
      batchSize: preset === 'production' ? 500 : 100,
      interval: preset === 'production' ? 2000 : 5000,
      timeout: 10000,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 60000,
        fallbackTransport: 'file',
      },
    },
    enableConsoleTransport: true,
    enableFileTransport: preset !== 'development',
    fileLogPath: './logs',
    maxFileSize: '200m',
    maxFiles: 30,
    includeTimestamp: true,
    includeMeta: true,
    samplingRate: preset === 'production' ? 0.8 : 1,
    enforceSchema: true,
  };

  return { ...base, ...overrides, loki: { ...base.loki, ...overrides.loki } };
}

function parseLokiLabels(labelsString?: string): Record<string, string> {
  if (!labelsString) return {};

  try {
    return JSON.parse(labelsString);
  } catch {
    // Try parsing as comma-separated key=value pairs
    const labels: Record<string, string> = {};
    labelsString.split(',').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        labels[key.trim()] = value.trim();
      }
    });
    return labels;
  }
}
