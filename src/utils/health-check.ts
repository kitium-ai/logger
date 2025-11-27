import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';

import axios, { type AxiosRequestConfig } from 'axios';

import { loggerMetrics } from './metrics';
import { getLoggerConfig, type LoggerConfig } from '../config/logger.config';
import { getLogger } from '../logger/logger';

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Health check result
 */
export type HealthCheckResult = {
  status: HealthStatus;
  timestamp: string;
  checks: {
    logger: {
      status: HealthStatus;
      details: Record<string, unknown>;
    };
    memory: {
      status: HealthStatus;
      details: Record<string, unknown>;
    };
    transport: {
      status: HealthStatus;
      details: Record<string, unknown>;
    };
  };
  uptime: number;
};

/**
 * Performs health checks on the logger system
 */
export async function performHealthCheck(
  config: LoggerConfig = getLoggerConfig()
): Promise<HealthCheckResult> {
  const now = new Date();
  const uptime = process.uptime();

  const loggerCheck = checkLoggerHealth();
  const memoryCheck = checkMemoryHealth();
  const transportCheck = await checkTransportHealth(config);

  const allStatuses = [loggerCheck.status, memoryCheck.status, transportCheck.status];
  let overallStatus = HealthStatus.HEALTHY;

  if (allStatuses.includes(HealthStatus.UNHEALTHY)) {
    overallStatus = HealthStatus.UNHEALTHY;
  } else if (allStatuses.includes(HealthStatus.DEGRADED)) {
    overallStatus = HealthStatus.DEGRADED;
  }

  return {
    status: overallStatus,
    timestamp: now.toISOString(),
    checks: {
      logger: loggerCheck,
      memory: memoryCheck,
      transport: transportCheck,
    },
    uptime,
  };
}

/**
 * Checks logger component health
 */
function checkLoggerHealth(): HealthCheckResult['checks']['logger'] {
  try {
    const logger = getLogger();
    const status = logger ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;

    return {
      status,
      details: {
        initialized: !!logger,
        totalLogsEmitted: loggerMetrics.logCounter.get(),
        totalErrors: loggerMetrics.errorCounter.get(),
      },
    };
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Checks memory health
 */
function checkMemoryHealth(): HealthCheckResult['checks']['memory'] {
  try {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // Consider unhealthy if heap is over 90% full
    let status = HealthStatus.HEALTHY;
    if (heapUsedPercent > 90) {
      status = HealthStatus.UNHEALTHY;
    } else if (heapUsedPercent > 75) {
      status = HealthStatus.DEGRADED;
    }

    return {
      status,
      details: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        heapUsedPercent: heapUsedPercent.toFixed(2),
        external: memUsage.external,
        rss: memUsage.rss,
      },
    };
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Checks transport health (simulated check for demonstration)
 */
async function checkTransportHealth(
  config: LoggerConfig
): Promise<HealthCheckResult['checks']['transport']> {
  const [loki, filesystem] = await Promise.all([
    checkLokiConnection(config.loki),
    checkFilesystemAccess(config.enableFileTransport, config.fileLogPath),
  ]);

  let status = HealthStatus.HEALTHY;
  const detailStatuses = [loki.status, filesystem.status];
  if (detailStatuses.includes(HealthStatus.UNHEALTHY)) {
    status = HealthStatus.UNHEALTHY;
  } else if (detailStatuses.includes(HealthStatus.DEGRADED)) {
    status = HealthStatus.DEGRADED;
  }

  return {
    status,
    details: {
      loki,
      filesystem,
    },
  };
}

async function checkLokiConnection(
  lokiConfig: LoggerConfig['loki']
): Promise<{ status: HealthStatus; [key: string]: unknown }> {
  if (!lokiConfig.enabled) {
    return {
      status: HealthStatus.HEALTHY,
      enabled: false,
      message: 'Loki disabled',
    };
  }

  const baseUrl = `${lokiConfig.protocol}://${lokiConfig.host}:${lokiConfig.port}`;
  const start = Date.now();

  try {
    const requestConfig: AxiosRequestConfig = {
      timeout: lokiConfig.timeout ?? 5000,
      validateStatus: () => true,
    };

    if (lokiConfig.basicAuth) {
      requestConfig.auth = {
        username: lokiConfig.basicAuth.username,
        password: lokiConfig.basicAuth.password,
      };
    }

    const response = await axios.get(`${baseUrl}/ready`, requestConfig);
    const latency = Date.now() - start;

    if (response.status >= 200 && response.status < 400) {
      return {
        status: HealthStatus.HEALTHY,
        connected: true,
        latencyMs: latency,
        endpoint: `${baseUrl}/ready`,
        statusCode: response.status,
      };
    }

    return {
      status: HealthStatus.DEGRADED,
      connected: false,
      latencyMs: latency,
      statusCode: response.status,
      message: 'Loki responded with non-OK status',
    };
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      connected: false,
      endpoint: `${baseUrl}/ready`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkFilesystemAccess(
  enabled: boolean,
  logPath: string
): Promise<{ status: HealthStatus; [key: string]: unknown }> {
  if (!enabled) {
    return {
      status: HealthStatus.HEALTHY,
      enabled: false,
      message: 'File transport disabled',
    };
  }

  const resolvedPath = resolvePath(logPath ?? './logs');

  try {
    await access(resolvedPath, fsConstants.W_OK);
    return {
      status: HealthStatus.HEALTHY,
      path: resolvedPath,
      writable: true,
    };
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      path: resolvedPath,
      writable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Express middleware for health check endpoint
 */
export function healthCheckMiddleware() {
  return async (
    request: { path: string; method: string },
    res: {
      status: (code: number) => { json: (data: unknown) => void };
      json: (data: unknown) => void;
    },
    next?: () => void
  ) => {
    if (request.path === '/health/logs' && request.method === 'GET') {
      const result = await performHealthCheck();
      const statusCode = result.status === HealthStatus.HEALTHY ? 200 : 503;
      res.status(statusCode).json(result);
      return;
    }

    if (next) {
      next();
    }
  };
}

/**
 * Get health status as human-readable string
 */
export function getHealthStatusMessage(result: HealthCheckResult): string {
  const { status, checks } = result;
  const parts: string[] = [];

  parts.push(`Overall Status: ${status.toUpperCase()}`);
  parts.push(`Logger: ${checks.logger.status.toUpperCase()}`);
  parts.push(
    `Memory: ${checks.memory.status.toUpperCase()} (${checks.memory.details['heapUsedPercent']}%)`
  );
  parts.push(`Transport: ${checks.transport.status.toUpperCase()}`);

  return parts.join(' | ');
}
