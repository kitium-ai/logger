import * as winston from 'winston';

import { contextManager } from '../context/async-context';
import type { LoggerConfig } from '../config/logger.config';

export type CoreLogSchema = {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  traceId: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  error?: { message: string; stack?: string };
};

export function applySchemaContract(config: LoggerConfig): winston.Logform.Format {
  return winston.format((info: winston.Logform.TransformableInfo) => {
    const context = contextManager.getContext();
    const normalizedMessage =
      typeof info.message === 'string' ? info.message : JSON.stringify(info.message ?? '');

    const schema: CoreLogSchema = {
      timestamp: (info['timestamp'] as string | undefined) ?? new Date().toISOString(),
      level: (info['level'] as string | undefined) ?? 'info',
      message: normalizedMessage,
      service: (info['service'] as string | undefined) ?? config.serviceName,
      environment: (info['environment'] as string | undefined) ?? config.environment,
      traceId: (info['traceId'] as string | undefined) ?? context.traceId,
    };

    const spanId = (info['spanId'] as string | undefined) ?? context.spanId;
    if (spanId) {
      schema.spanId = spanId;
    }

    const userId = (info['userId'] as string | undefined) ?? context.userId;
    if (userId) {
      schema.userId = userId;
    }

    const requestId = (info['requestId'] as string | undefined) ?? context.requestId;
    if (requestId) {
      schema.requestId = requestId;
    }

    const sessionId = (info['sessionId'] as string | undefined) ?? context.sessionId;
    if (sessionId) {
      schema.sessionId = sessionId;
    }

    const correlationId = (info['correlationId'] as string | undefined) ?? context.correlationId;
    if (correlationId) {
      schema.correlationId = correlationId;
    }

    const metadata =
      (info['metadata'] as Record<string, unknown> | undefined) ??
      (info['meta'] as Record<string, unknown> | undefined) ??
      context.metadata;
    if (metadata) {
      schema.metadata = metadata;
    }

    const error = info['error'] as { message: string; stack?: string } | undefined;
    if (error) {
      schema.error = error;
    }

    return { ...info, ...schema };
  })();
}
