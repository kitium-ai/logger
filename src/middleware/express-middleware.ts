import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { contextManager, type LogContext } from '../context/async-context';
import { TraceContextExtractor } from '../context/trace-context-extractor';
import { getLogger } from '../logger/logger';
import { PIIPatterns, SENSITIVE_FIELDS } from '../utils/pii-patterns';

const REQUEST_COMPLETED_MSG = 'Request completed';
const USER_AGENT_HEADER = 'user-agent';
const DEFAULT_SENSITIVE_FIELDS = SENSITIVE_FIELDS as unknown as string[];

// Augment Express Request type to include user property
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      user?: { id?: string };
    }
  }
}

/**
 * Middleware to add tracing and context to all requests
 */
/* eslint-disable max-lines-per-function */
export function tracingMiddleware(): (request: Request, res: Response, next: NextFunction) => void {
  /* eslint-disable max-lines-per-function */
  return (request: Request, res: Response, next: NextFunction): void => {
    // Extract trace context using centralized extractor
    const getHeader = (name: string): string | string[] | undefined => request.get(name);
    const incomingContext = TraceContextExtractor.extractTraceContext(getHeader);
    const context = TraceContextExtractor.extractLogContext(getHeader, true);

    // Generate request ID if not provided
    const requestId = context.requestId ?? uuidv4();
    const fullContext: LogContext = {
      ...context,
      requestId,
    };

    contextManager.run(fullContext, () => {
      // Set response headers for trace propagation
      TraceContextExtractor.setResponseHeaders(
        (name, value) => res.setHeader(name, value),
        fullContext
      );

      const startTime = Date.now();

      const originalJson = res.json.bind(res);
      res.json = function (body) {
        const duration = Date.now() - startTime;
        getLogger().http(REQUEST_COMPLETED_MSG, {
          method: request.method,
          path: request.path,
          statusCode: res.statusCode,
          duration,
          ip: request.ip,
          userAgent: request.get(USER_AGENT_HEADER),
        });
        return originalJson(body);
      };

      const originalSend = res.send.bind(res);
      res.send = function (data) {
        if (!res.headersSent) {
          const duration = Date.now() - startTime;
          getLogger().http(REQUEST_COMPLETED_MSG, {
            method: request.method,
            path: request.path,
            statusCode: res.statusCode,
            duration,
            ip: request.ip,
            userAgent: request.get(USER_AGENT_HEADER),
          });
        }
        return originalSend(data);
      };

      getLogger().http('Incoming request', {
        method: request.method,
        path: request.path,
        query: request.query,
        ip: request.ip,
        userAgent: request.get('user-agent'),
        parentSpanId: incomingContext.parentSpanId,
      });

      next();
    });
  };
}

/**
 * Middleware to catch and log errors
 */
export function errorLoggingMiddleware() {
  return (error: Error | unknown, request: Request, res: Response, _next: NextFunction) => {
    const logger = getLogger();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorAny = error as any;
    const statusCode = errorAny.statusCode ?? errorAny.status ?? 500;
    const message = errorAny.message ?? 'Internal Server Error';
    const stack = errorAny.stack ?? (error instanceof Error ? error.stack : null);

    logger.error(`Request error: ${message}`, {
      statusCode,
      method: request.method,
      path: request.path,
      stack,
      query: request.query,
      body: sanitizeBody(request.body),
    });

    res.status(statusCode).json({
      error: message,
      status: statusCode,
      traceId: contextManager.get('traceId'),
      ...(process.env['NODE_ENV'] !== 'production' && {
        stack,
      }),
    });
  };
}

/**
 * Middleware to log request body (with sensitive data filtering)
 */
export function bodyLoggingMiddleware(sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS) {
  return (request: Request, _res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      const sanitized = sanitizeData(request.body, sensitiveFields);
      getLogger().debug('Request body', {
        method: request.method,
        path: request.path,
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
  return (request: Request, res: Response, next: NextFunction) => {
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
          method: request.method,
          path: request.path,
          duration,
          statusCode: res.statusCode,
          memoryDelta,
        });
      }

      getLogger().debug('Performance metrics', {
        method: request.method,
        path: request.path,
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
  if (!body) {
    return body;
  }
  return sanitizeData(body, DEFAULT_SENSITIVE_FIELDS);
}

/**
 * Utility to sanitize data by removing sensitive fields
 */
export function sanitizeData(data: unknown, sensitiveFields: string[]): unknown {
  return PIIPatterns.sanitizeObject(data, {
    sensitiveFields,
    redactionText: '[REDACTED]',
    deep: true,
  });
}

/**
 * Middleware to set user context from request
 */
export function userContextMiddleware(userIdExtractor?: (request: Request) => string | undefined) {
  return (request: Request, _res: Response, next: NextFunction) => {
    const userId =
      userIdExtractor?.(request) ??
      (request.get('x-user-id') as string) ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request.user as any)?.id;

    if (userId) {
      contextManager.set('userId', userId);
    }

    next();
  };
}
