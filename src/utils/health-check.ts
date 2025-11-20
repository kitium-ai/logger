import { getLogger } from '../logger/logger';
import { loggerMetrics } from './metrics';

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
export interface HealthCheckResult {
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
}

/**
 * Performs health checks on the logger system
 */
export function performHealthCheck(): HealthCheckResult {
  const now = new Date();
  const uptime = process.uptime();

  // Check logger health
  const loggerCheck = checkLoggerHealth();

  // Check memory health
  const memoryCheck = checkMemoryHealth();

  // Check transport health
  const transportCheck = checkTransportHealth();

  // Determine overall status
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
function checkTransportHealth(): HealthCheckResult['checks']['transport'] {
  try {
    // In a real implementation, this would check:
    // - Loki connectivity
    // - File system availability
    // - Network connectivity

    return {
      status: HealthStatus.HEALTHY,
      details: {
        loki: {
          connected: true, // Would be actual check in production
          latency: 0,
        },
        filesystem: {
          available: true,
        },
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
 * Express middleware for health check endpoint
 */
export function healthCheckMiddleware() {
  return (req: { path: string; method: string }, res: {
    status: (code: number) => { json: (data: unknown) => void };
    json: (data: unknown) => void;
  }, next?: () => void) => {
    // Only handle /health/logs endpoint
    if (req.path === '/health/logs' && req.method === 'GET') {
      const result = performHealthCheck();
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
  parts.push(`Memory: ${checks.memory.status.toUpperCase()} (${(checks.memory.details.heapUsedPercent)}%)`);
  parts.push(`Transport: ${checks.transport.status.toUpperCase()}`);

  return parts.join(' | ');
}
