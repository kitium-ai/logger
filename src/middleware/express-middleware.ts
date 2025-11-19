import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../logger/logger';
import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';

/**
 * Middleware to add tracing and context to all requests
 */
export function tracingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate or extract trace ID
    const traceId =
      (req.get('x-trace-id') as string) ??
      (req.get('x-request-id') as string) ??
      uuidv4();

    const spanId = uuidv4();
    const requestId = uuidv4();

    // Extract user info if available
    const userId = (req.get('x-user-id') as string) ?? null;
    const sessionId = (req.get('x-session-id') as string) ?? null;
    const correlationId = (req.get('x-correlation-id') as string) ?? null;

    // Initialize context for this request
    const context: LogContext = {
      traceId,
      spanId,
      requestId,
      userId,
      sessionId,
      correlationId,
    };

    // Run the entire request in this context
    contextManager.run(context, () => {
      // Add trace headers to response
      res.setHeader('x-trace-id', traceId);
      res.setHeader('x-request-id', requestId);
      if (spanId) {
        res.setHeader('x-span-id', spanId);
      }

      // Record request start time
      const startTime = Date.now();

      // Patch response.json to log before sending
      const originalJson = res.json.bind(res);
      res.json = function (body) {
        const duration = Date.now() - startTime;
        getLogger().http('Request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        return originalJson(body);
      };

      // Patch response.send for other responses
      const originalSend = res.send.bind(res);
      res.send = function (data) {
        if (!res.headersSent) {
          const duration = Date.now() - startTime;
          getLogger().http('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          });
        }
        return originalSend(data);
      };

      // Log incoming request
      getLogger().http('Incoming request', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      next();
    });
  };
}

/**
 * Middleware to catch and log errors
 */
export function errorLoggingMiddleware() {
  return (err: Error | unknown, req: Request, res: Response, _next: NextFunction) => {
    const logger = getLogger();

    const statusCode = (err as any).statusCode ?? (err as any).status ?? 500;
    const message = (err as any).message ?? 'Internal Server Error';

    logger.error(`Request error: ${message}`, {
      statusCode,
      method: req.method,
      path: req.path,
      stack: err.stack,
      query: req.query,
      body: sanitizeBody(req.body),
    });

    res.status(statusCode).json({
      error: message,
      status: statusCode,
      traceId: contextManager.get('traceId'),
      ...(process.env.NODE_ENV !== 'production' && {
        stack: err.stack,
      }),
    });
  };
}

/**
 * Middleware to log request body (with sensitive data filtering)
 */
export function bodyLoggingMiddleware(sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const sanitized = sanitizeData(req.body, sensitiveFields);
      getLogger().debug('Request body', {
        method: req.method,
        path: req.path,
        body: sanitized,
      });
    }
    next();
  };
}

/**
 * Middleware to log performance metrics
 */
export function performanceMetricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      const memoryDelta = {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
      };

      if (duration > 1000) {
        // Log slow requests
        getLogger().warn('Slow request detected', {
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode,
          memoryDelta,
        });
      }

      getLogger().debug('Performance metrics', {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
        memoryDelta,
      });
    });

    next();
  };
}

/**
 * Utility to add custom metadata to current request context
 */
export function addMetadata(key: string, value: unknown): void {
  contextManager.addMetadata(key, value);
}

/**
 * Utility to sanitize request body
 */
function sanitizeBody(body: unknown): unknown {
  if (!body) return body;
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  return sanitizeData(body, sensitiveFields);
}

/**
 * Utility to sanitize data by removing sensitive fields
 */
export function sanitizeData(data: unknown, sensitiveFields: string[]): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, sensitiveFields));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Middleware to set user context from request
 */
export function userContextMiddleware(
  userIdExtractor?: (req: Request) => string | undefined,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId =
      userIdExtractor?.(req) ??
      (req.get('x-user-id') as string) ??
      (req.user as unknown as any)?.id;

    if (userId) {
      contextManager.set('userId', userId);
    }

    next();
  };
}
