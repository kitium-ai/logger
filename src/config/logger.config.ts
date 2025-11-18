import * as dotenv from 'dotenv';

dotenv.config();

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

export interface LokiConfig {
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
}

export interface LoggerConfig {
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
}

export const getLoggerConfig = (): LoggerConfig => {
  const environment = (process.env.NODE_ENV || 'development') as
    | 'development'
    | 'staging'
    | 'production';

  const logLevel = (process.env.LOG_LEVEL || LogLevel.INFO) as LogLevel;

  const lokiConfig: LokiConfig = {
    enabled: process.env.LOKI_ENABLED !== 'false',
    host: process.env.LOKI_HOST || 'localhost',
    port: parseInt(process.env.LOKI_PORT || '3100', 10),
    protocol: (process.env.LOKI_PROTOCOL || 'http') as 'http' | 'https',
    labels: {
      service: process.env.SERVICE_NAME || 'default-service',
      environment,
      ...parseLokiLabels(process.env.LOKI_LABELS),
    },
    ...(process.env.LOKI_USERNAME &&
      process.env.LOKI_PASSWORD && {
        basicAuth: {
          username: process.env.LOKI_USERNAME,
          password: process.env.LOKI_PASSWORD,
        },
      }),
    batchSize: parseInt(process.env.LOKI_BATCH_SIZE || '100', 10),
    interval: parseInt(process.env.LOKI_INTERVAL || '5000', 10),
    timeout: parseInt(process.env.LOKI_TIMEOUT || '10000', 10),
  };

  return {
    serviceName: process.env.SERVICE_NAME || 'default-service',
    environment,
    logLevel,
    loki: lokiConfig,
    enableConsoleTransport: process.env.LOG_CONSOLE !== 'false',
    enableFileTransport: process.env.LOG_FILE_ENABLED === 'true',
    fileLogPath: process.env.LOG_FILE_PATH || './logs',
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '100m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '14', 10),
    includeTimestamp: process.env.LOG_INCLUDE_TIMESTAMP !== 'false',
    includeMeta: process.env.LOG_INCLUDE_META !== 'false',
  };
};

function parseLokiLabels(labelsStr?: string): Record<string, string> {
  if (!labelsStr) return {};

  try {
    return JSON.parse(labelsStr);
  } catch {
    // Try parsing as comma-separated key=value pairs
    const labels: Record<string, string> = {};
    labelsStr.split(',').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        labels[key.trim()] = value.trim();
      }
    });
    return labels;
  }
}
