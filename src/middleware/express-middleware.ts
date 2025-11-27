import { randomBytes } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import type { LogContext } from '../context/async-context';
import { contextManager } from '../context/async-context';
import { getLogger } from '../logger/logger';

const REQUEST_COMPLETED_MSG = 'Request completed';
const USER_AGENT_HEADER = 'user-agent';

// Augment Express Request type to include user property
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      user?: { id?: string };
    }
  }
}

const TRACEPARENT_REGEX = /^[\da-f]{2}-([\da-f]{32})-([\da-f]{16})-[\da-f]{2}$/i;
const DEFAULT_TRACE_VERSION = '00';

type IncomingTraceContext = {
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
};

const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api-key',
  'authorization',
  'cookie',
  'set-cookie',
  'jwt',
  'session',
  'credential',
];

const SENSITIVE_VALUE_PATTERNS: RegExp[] = [
  /bearer\s+[a-z0-9\.\-_]+/i,
  /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/, // JWT
  /\b(?:\d[ -]*?){13,16}\b/, // credit card
  /\b[A-Fa-f0-9]{64}\b/, // access tokens/hashes
];

function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

function generateSpanId(): string {
  return randomBytes(8).toString('hex');
}

function buildTraceparent(traceId: string, spanId: string, sampled = '01'): string {
  const normalizedTraceId = traceId.replace(/-/g, '').padEnd(32, '0').slice(0, 32);
  const normalizedSpanId = spanId.replace(/-/g, '').padEnd(16, '0').slice(0, 16);
  return `${DEFAULT_TRACE_VERSION}-${normalizedTraceId}-${normalizedSpanId}-${sampled}`;
}

function parseTraceParent(header?: string): IncomingTraceContext {
  if (!header) return {};
  const matches = TRACEPARENT_REGEX.exec(header.trim());
  if (!matches) {
    return {};
  }
  const context: IncomingTraceContext = {};
  if (matches[1]) {
    context.traceId = matches[1];
  }
  if (matches[2]) {
    context.spanId = matches[2];
  }
  return context;
}

// eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
function parseB3Headers(request: Request): IncomingTraceContext {
  const b3Combined = request.get('b3') as string | undefined;
  if (b3Combined) {
    const parts = b3Combined.split('-');
    if (parts.length >= 2) {
      const context: IncomingTraceContext = {};
      if (parts[0]) {
        context.traceId = parts[0];
      }
      if (parts[1]) {
        context.spanId = parts[1];
      }
      if (parts[2]) {
        context.parentSpanId = parts[2];
      }
      return context;
    }
  }

  const context: IncomingTraceContext = {};
  const traceId = (request.get('x-b3-traceid') as string) ?? undefined;
  const spanId = (request.get('x-b3-spanid') as string) ?? undefined;
  const parentSpanId = (request.get('x-b3-parentspanid') as string) ?? undefined;

  if (traceId) {
    context.traceId = traceId;
  }
  if (spanId) {
    context.spanId = spanId;
  }
  if (parentSpanId) {
    context.parentSpanId = parentSpanId;
  }

  return context;
}

function extractTraceContext(request: Request): IncomingTraceContext {
  const traceParent = parseTraceParent(request.get('traceparent') as string);
  if (traceParent.traceId && traceParent.spanId) {
    return traceParent;
  }

  const b3Context = parseB3Headers(request);
  if (b3Context.traceId || b3Context.spanId) {
    return b3Context;
  }

  return {};
}

function shouldRedactKey(key: string, sensitiveFields: string[]): boolean {
  const normalizedKey = key.toLowerCase();
  return sensitiveFields.some((field) => normalizedKey.includes(field.toLowerCase()));
}

function isSensitiveValue(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Middleware to add tracing and context to all requests
 */
/* eslint-disable max-lines-per-function */
export function tracingMiddleware() {
  /* eslint-disable max-lines-per-function */
  return (request: Request, res: Response, next: NextFunction) => {
    const incomingContext = extractTraceContext(request);

    const traceId =
      incomingContext.traceId ??
      (request.get('x-trace-id') as string) ??
      (request.get('x-request-id') as string) ??
      generateTraceId();

    const spanId =
      incomingContext.spanId ?? (request.get('x-span-id') as string) ?? generateSpanId();
    const requestId = uuidv4();

    const userId = (request.get('x-user-id') as string) ?? null;
    const sessionId = (request.get('x-session-id') as string) ?? null;
    const correlationId = (request.get('x-correlation-id') as string) ?? null;

    const context: LogContext = {
      traceId,
      spanId,
      requestId,
      userId,
      sessionId,
      correlationId,
    };

    contextManager.run(context, () => {
      res.setHeader('x-trace-id', traceId);
      res.setHeader('x-request-id', requestId);
      res.setHeader('x-span-id', spanId);
      res.setHeader('traceparent', buildTraceparent(traceId, spanId));

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
  if (!body) return body;
  return sanitizeData(body, DEFAULT_SENSITIVE_FIELDS);
}

/**
 * Utility to sanitize data by removing sensitive fields
 */
export function sanitizeData(data: unknown, sensitiveFields: string[]): unknown {
  if (typeof data !== 'object' || data === null) {
    if (isSensitiveValue(data)) {
      return '[REDACTED]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, sensitiveFields));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (shouldRedactKey(key, sensitiveFields) || isSensitiveValue(value)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, sensitiveFields);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
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
